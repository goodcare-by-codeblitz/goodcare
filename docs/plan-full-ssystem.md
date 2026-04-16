# Plan: Full Multi-Tenant Care Management System

## Context

Goodcare has a working auth flow (register, login, forgot-password, logout) with email delivery via SendGrid/BullMQ, and a seeded RBAC system (8 roles, 21 permissions). However, the system has **critical security gaps** (no auth middleware, unauthenticated org routes, missing refresh endpoint) and most domain models are commented out. This plan builds the system into a fully functional, secure multi-tenant application where admins can manage organisations, invite users with specific roles, and manage patients — with complete data isolation between tenants.

---

## Phase 1: Security Foundations

### 1.1 Fastify Type Augmentation

**Create** `apps/backend/src/types/fastify.d.ts`

- Extend `FastifyRequest` with `user` and `org` properties
- `user`: `{ id, email, permissions: string[], organizationMemberships: Array<{ orgId, orgSlug, role, status }> }`
- `org`: `{ id, slug, name, userPermissions: string[], membershipStatus }>`

### 1.2 Authentication Middleware

**Create** `apps/backend/src/middleware/authenticate.ts`

- `preHandler` hook: reads `access_token` cookie, calls `app.jwt.verify()` (NOT decode)
- Loads user + org memberships from DB
- Loads user's platform-level permissions via `RoleAssignment` (where `organizationId IS NULL`)
- Decorates `request.user`
- Returns 401 if token missing/invalid/expired

### 1.3 Organization Scoping Middleware

**Create** `apps/backend/src/middleware/org-scope.ts`

- `preHandler` hook: extracts `:organizationId` from route params
- Verifies user has ACTIVE membership in that org (from `request.user.organizationMemberships`)
- Loads org-scoped permissions via `RoleAssignment` JOIN `RolePermission` JOIN `Permission`
- Decorates `request.org` with org details + scoped permissions
- Returns 403 if not a member

### 1.4 Authorization Middleware

**Create** `apps/backend/src/middleware/authorize.ts`

- Factory: `authorize(...requiredPermissions: string[])` returns `preHandler`
- Checks `request.org.userPermissions` has ALL required permissions
- Returns 403 with structured error if missing
- Also export `authorizePlatform()` for platform-level routes

### 1.5 Typed Error Classes

**Create** `apps/backend/src/lib/errors.ts`

- `NotFoundError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`, `ValidationError`
- Each has `statusCode` property

**Modify** `apps/backend/server.ts`

- Register `decorateRequest` for `user` and `org`
- Add `setErrorHandler` mapping typed errors to HTTP status codes
- Register org routes at `/orgs` prefix

### 1.6 Fix Logout Security

**Modify** `apps/backend/src/modules/auth/auth.controller.ts:163-186`

- Replace `app.jwt.decode()` with `app.jwt.verify()` to prevent token forgery
- Or better: use the new `authenticate` middleware as a preHandler on the logout route

### 1.7 Tests

**Create** `apps/backend/src/middleware/__tests__/authenticate.test.ts`
**Create** `apps/backend/src/middleware/__tests__/authorize.test.ts`

---

## Phase 2: Critical Auth Fixes

### 2.1 Refresh Token Endpoint

**Add** `POST /auth/refresh` to auth module

**Files to modify:**

- `auth.routes.ts` — add route
- `auth.controller.ts` — add `refreshController`: read `refresh_token` cookie, verify JWT, extract `sid`
- `auth.service.ts` — add `refreshService`: look up Session by `sessionId`, verify `refreshTokenHash` with `verifyTokenHash()`, check not expired/revoked, return userId/email
- `auth.schemas.ts` — add refresh schema
- `auth.types.ts` — add `RefreshResult` type

**Flow:** Verify refresh JWT → find session → verify hash → sign new access token → set cookie → optionally rotate refresh token

### 2.2 Password Reset Completion

**Add** `POST /auth/reset-password`

**Files to modify:** same auth module files

- Accept `{ token, newPassword }`
- Hash token → find `PasswordResetToken` → verify not used/expired
- Transaction: update `User.passwordHash`, mark token used, delete all user sessions

### 2.3 Fix Login Multi-Org Support

**Modify** `auth.service.ts:145`

- Return ALL organizations (not just `[0]`)
- Update `LoginResult.organizations` to be an array

### 2.4 Fix Insecure Invitation Token

**Modify** `apps/backend/utils/invitation-token.ts`

- Replace `Math.random()` with `crypto.randomBytes(32).toString('hex')`

### 2.5 Tests for all new endpoints

---

## Phase 3: Organisation Management

### 3.1 Restructure Organisation Module

Replace the current monolithic `members.ts` with proper module pattern:

**Refactor into:**

- `apps/backend/src/modules/organisation/org.routes.ts` — all routes with middleware chains
- `apps/backend/src/modules/organisation/org.controller.ts` — HTTP handlers
- `apps/backend/src/modules/organisation/org.service.ts` — business logic, all queries scoped by `organizationId`
- `apps/backend/src/modules/organisation/org.schemas.ts` — Fastify JSON validation schemas
- `apps/backend/src/modules/organisation/org.types.ts` — types
- **Delete** `members.ts` after migration

### 3.2 Organisation Endpoints (all require `authenticate` + `orgScope`)

| Method | Path                                    | Permission            | Description               |
| ------ | --------------------------------------- | --------------------- | ------------------------- |
| GET    | `/orgs/:organizationId`                 | membership            | View org details          |
| PATCH  | `/orgs/:organizationId`                 | `manage_organization` | Update org name/settings  |
| GET    | `/orgs/:organizationId/members`         | `view_users`          | List members with roles   |
| PATCH  | `/orgs/:organizationId/members/:userId` | `manage_members`      | Update member role/status |
| DELETE | `/orgs/:organizationId/members/:userId` | `manage_members`      | Remove/suspend member     |

### 3.3 Key Security Fixes in Org Service

- All queries include `WHERE organizationId = :orgId`
- `invitedById` uses `request.user.id` (not the invited user's ID — current bug in members.ts:64)
- Validate role being assigned is ORGANIZATION-scoped
- Prevent removing the last Admin from an org

### 3.4 Register routes in server.ts

**Modify** `apps/backend/server.ts` — `app.register(orgRoutes, { prefix: '/orgs' })`

### 3.5 Tests

---

## Phase 4: Invitation System

### 4.1 Uncomment InviteToken Model

**Modify** `packages/db/prisma/schema.prisma`

- Uncomment `InviteToken` model and all its relations on `User`, `Organization`, `OrganizationUser`
- Run migration: `pnpm -F @repo/db db:migrate`

### 4.2 Create Invitation Module

**Create** `apps/backend/src/modules/invitation/` with full module pattern

### 4.3 Invitation Endpoints

| Method | Path                                          | Auth             | Description                   |
| ------ | --------------------------------------------- | ---------------- | ----------------------------- |
| POST   | `/orgs/:organizationId/invitations`           | `manage_members` | Send invite email             |
| GET    | `/orgs/:organizationId/invitations`           | `manage_members` | List pending invites          |
| DELETE | `/orgs/:organizationId/invitations/:inviteId` | `manage_members` | Revoke invite                 |
| POST   | `/auth/accept-invite`                         | Public           | Accept invite + register/join |

### 4.4 Invite Flow

1. Admin hits `POST /orgs/:orgId/invitations` with `{ email, roleId }`
2. Validate roleId is ORGANIZATION-scoped
3. Check idempotency: if unexpired invite exists for same email+org, return it
4. Generate secure token via `crypto.randomBytes(32)`, hash with `hashToken()`, store in `InviteToken`
5. Create `OrganizationUser` with status=INVITED
6. Enqueue invitation email via BullMQ

### 4.5 Accept-Invite Flow

1. Recipient hits `POST /auth/accept-invite` with `{ token, firstName?, lastName?, password? }`
2. Hash token → find `InviteToken` → verify not expired/used/revoked
3. If user exists: create `OrganizationUser` (ACTIVE) + `RoleAssignment`
4. If new user: create `User` + `OrganizationUser` + `RoleAssignment`
5. Mark `InviteToken.usedAt = now()`
6. Create session, set auth cookies (auto-login)

### 4.6 Email Queue Extension

**Modify** `apps/backend/src/jobs/job-types.ts` — add `InvitationEmailPayload`
**Modify** `apps/backend/src/jobs/email-queue.ts` — add `enqueueInvitationEmail`
**Modify** `apps/backend/src/jobs/email-worker.ts` — add `invitation` case

### 4.7 Tests

---

## Phase 5: Patient Management

### 5.1 Patient Module

**Create** `apps/backend/src/modules/patient/` with full module pattern

### 5.2 Patient Endpoints (all org-scoped)

| Method | Path                                        | Permission        | Description          |
| ------ | ------------------------------------------- | ----------------- | -------------------- |
| POST   | `/orgs/:organizationId/patients`            | `manage_patients` | Create patient       |
| GET    | `/orgs/:organizationId/patients`            | `view_patients`   | List with pagination |
| GET    | `/orgs/:organizationId/patients/:patientId` | `view_patients`   | Get details          |
| PATCH  | `/orgs/:organizationId/patients/:patientId` | `manage_patients` | Update patient       |
| DELETE | `/orgs/:organizationId/patients/:patientId` | `manage_patients` | Soft delete          |

### 5.3 Multi-Tenant Isolation

- Every query: `WHERE organizationId = request.org.id AND deletedAt IS NULL`
- On create: set `organizationId` from `request.org.id` (never from request body)
- On get/update/delete: verify patient belongs to org before operating

### 5.4 Schema Updates

**Modify** `packages/db/prisma/schema.prisma`

- Uncomment Patient indexes: `@@unique([id, organizationId])`, `@@index([organizationId])`, `@@index([lastName, firstName])`

### 5.5 Tests

---

## Phase 6: Activate Domain Models

Do as separate sub-phases, each with its own migration:

### 6A. Address Model

- Uncomment `Address` and relations on `Organization`, `Patient`
- Create address CRUD as part of patient/org modules (no standalone module needed)

### 6B. Carer Module

- Uncomment `Carer`, `Qualification`, `QualificationType`
- **Create** `apps/backend/src/modules/carer/` module
- Endpoints: CRUD for carers (requires `manage_carers`), qualification management (requires `manage_qualifications`)
- Carer links to `OrganizationUser` — invited user with Caregiver role becomes a Carer record

### 6C. Visit Module

- Uncomment `Visit`, `VisitAssignment`, `VisitTask`
- **Create** `apps/backend/src/modules/visit/` module
- Endpoints: schedule, assign carers (`assign_visits`), update status, list by date/patient/carer

### 6D. CarePlan Module

- Uncomment `CarePlan`
- **Create** `apps/backend/src/modules/care-plan/` module
- Versioned care plans per patient

### 6E. DailyNote & IncidentReport

- Uncomment both models
- Create modules for each

---

## Phase 7: Audit Logging

### 7.1 Uncomment AuditLog Model

**Modify** schema — uncomment `AuditLog` and relations, run migration

### 7.2 Audit Service

**Create** `apps/backend/src/lib/audit.ts`

- `logAudit({ action, entityType, entityId, oldValues?, newValues?, organizationId, actorUserId, ip?, userAgent? })`
- Fire-and-forget (don't await in request path)

### 7.3 Audit Endpoints

- `GET /orgs/:organizationId/audit-logs` — requires `view_audit_logs`, paginated with filters

### 7.4 Integrate into all state-changing operations

---

## Security Summary

| Issue                                 | Fix                                        | Phase |
| ------------------------------------- | ------------------------------------------ | ----- |
| No auth middleware                    | Create `authenticate` preHandler           | 1     |
| No authorization                      | Create `authorize()` factory               | 1     |
| Unauthenticated org routes            | Add middleware chains                      | 1+3   |
| Logout uses `decode()` not `verify()` | Switch to `verify()`                       | 1     |
| No refresh endpoint                   | Add `POST /auth/refresh`                   | 2     |
| No password reset completion          | Add `POST /auth/reset-password`            | 2     |
| `Math.random()` tokens                | Use `crypto.randomBytes()`                 | 2     |
| Login returns single org              | Return all orgs                            | 2     |
| `invitedById` set to invited user     | Use `request.user.id`                      | 3     |
| No org-scoping on queries             | All queries include `organizationId`       | 3+    |
| No data isolation enforcement         | `orgScope` middleware validates membership | 1     |

---

## Verification Plan

After each phase:

1. Run `pnpm -F @repo/backend test` — all tests pass
2. Run `pnpm check-types` — no type errors
3. Manual testing with curl/Postman:
   - Register → login → access protected org routes
   - Try accessing another org's data → expect 403
   - Invite user → accept invite → verify role/permissions
   - Create patient → verify org-scoped isolation
4. After schema changes: `pnpm -F @repo/db db:generate && pnpm -F @repo/db db:migrate`

---

## Key Files Reference

| File                                               | Role                                                     |
| -------------------------------------------------- | -------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                 | Central schema — uncomment models progressively          |
| `packages/db/prisma/seed.ts`                       | RBAC seed — roles, permissions, mappings                 |
| `apps/backend/server.ts`                           | App entry — register routes, plugins, error handler      |
| `apps/backend/src/modules/auth/auth.controller.ts` | Auth handlers — fix logout, add refresh/reset            |
| `apps/backend/src/modules/auth/auth.service.ts`    | Auth logic — add refresh/reset services, multi-org login |
| `apps/backend/src/modules/organisation/members.ts` | **Replace** — refactor into proper module with auth      |
| `apps/backend/utils/token-hash.ts`                 | Reuse for all token hashing (invites, reset)             |
| `apps/backend/utils/cookies.ts`                    | Reuse for auth cookie management                         |
| `apps/backend/src/jobs/job-types.ts`               | Extend with invitation email type                        |
| `apps/backend/utils/invitation-token.ts`           | Fix to use `crypto.randomBytes()`                        |
