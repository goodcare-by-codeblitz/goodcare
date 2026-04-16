# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goodcare is a compliant, audit-ready system for domiciliary care companies. It is a **pnpm + Turborepo monorepo** with three apps and two shared packages.

```
apps/
  backend/   — Fastify REST API (TypeScript, tsx dev server)
  web/       — Next.js 16 + React 19 + Tailwind CSS
  mobile/    — Expo / React Native (carers mobile app)
packages/
  db/        — Prisma client + PostgreSQL schema (shared across apps)
  helpers/   — Shared utilities (password hashing via bcrypt)
```

## Commands

### Root (runs all workspaces via Turborepo)
```bash
pnpm dev           # start all apps in dev mode
pnpm build         # build all apps
pnpm check-types   # typecheck all workspaces
```

### Backend only
```bash
pnpm -F @repo/backend dev     # tsx watch server.ts (port 3000 default)
pnpm -F @repo/backend build   # tsc compile
```

### Database (`packages/db`)
```bash
pnpm -F @repo/db db:generate   # regenerate Prisma client after schema changes
pnpm -F @repo/db db:migrate    # run prisma migrate dev (interactive)
pnpm -F @repo/db db:seed       # seed roles, permissions, and superadmin
pnpm -F @repo/db db:reset      # prisma migrate reset --force (destructive)
```

### Testing
```bash
# Run all tests once
pnpm --filter @repo/backend test
pnpm --filter @repo/helpers test

# Watch mode during development
pnpm --filter @repo/backend test:watch
```

### Mobile
```bash
pnpm -F carers-mobile-app android
pnpm -F carers-mobile-app ios
pnpm -F carers-mobile-app web
```

## Environment Variables

Backend and db packages read from `.env`. Required vars:

| Variable | Used by |
|---|---|
| `DIRECT_URL` | Prisma — PostgreSQL connection string |
| `JWT_SECRET` | Backend — signs JWTs |
| `COOKIE_SECRET` | Backend — signs cookies |
| `PLATFORM_SUPERUSER_EMAIL` | Seed + auth service |
| `PLATFORM_SUPERUSER_PASSWORD` | Seed script |
| `PORT` | Backend (optional, defaults to 3000) |

The `packages/db/.env` file configures the database. The backend `.env` or environment inherits `DIRECT_URL` for the shared Prisma client.

## Architecture

### Backend module pattern
Each feature lives in `apps/backend/src/modules/<name>/` with four files:
- `*.routes.ts` — registers Fastify routes and maps to controller handlers
- `*.controller.ts` — handles HTTP request/response, creates JWTs/sessions, calls service
- `*.service.ts` — business logic and Prisma queries (no Fastify types here)
- `*.schemas.ts` — Fastify JSON schema for request validation (`opts` objects passed to route registration)
- `*.types.ts` — TypeScript types for the module

Utility helpers live in `apps/backend/utils/`: cookie management (`cookies.ts`), token hashing (`token-hash.ts`), slug generation (`generate-slug.ts`).

### Authentication flow
- Registration/login: controller creates a `sessionId` (UUID) + signs a refresh JWT, hashes the refresh token and stores it in the `Session` table alongside IP/user-agent.
- Access token: short-lived (10 min), stored as `access_token` httpOnly cookie.
- Refresh token: 30-day, stored as `refresh_token` httpOnly cookie scoped to `/auth/refresh`.
- Logout: deletes all sessions for the user from the DB, clears both cookies.

### Database / Prisma
- Schema: `packages/db/prisma/schema.prisma`
- Generated client output: `packages/db/generated/client/` (non-standard path — always run `db:generate` after schema changes)
- Prisma config: `packages/db/prisma.config.ts` (uses `DIRECT_URL`)
- Client instantiated with `PrismaPg` adapter (pg pool) in `packages/db/src/client.ts`, exported via `packages/db/src/index.ts`
- Import in backend: `import { prisma } from '@repo/db'`

### Data model highlights
- **Multi-tenant**: `Organization` is the root tenant. Users join via `OrganizationUser` (many-to-many with membership status).
- **RBAC**: `Role` (scoped PLATFORM or ORGANIZATION) → `RolePermission` → `Permission`. `RoleAssignment` links users to roles with optional `organizationId`.
- Many models (Carer, Visit, CarePlan, etc.) are defined but **commented out** in the schema — they are planned but not yet active.
- `Session` table tracks refresh tokens; `sessionId` field is the UUID payload in the refresh JWT.

### Shared packages
- `@repo/db` — exports `prisma` client instance
- `@repo/helpers` — exports `hashPassword` and `verifyPassword` (bcrypt wrappers)
