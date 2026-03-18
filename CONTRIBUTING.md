# Contributing to Goodcare

## Getting Started

Follow the [onboarding guide](./docs/onboarding.md) to set up your local environment.

## Code Style

- **Strict TypeScript**: `strict: true`, `exactOptionalPropertyTypes: true`, `verbatimModuleSyntax: true`
- Use `import type {}` for type-only imports (required by `verbatimModuleSyntax`)
- Add `| undefined` on all optional type fields (required by `exactOptionalPropertyTypes`)
- Service functions must have explicit return type annotations (avoids Prisma "cannot be named" errors)

## Branch Naming

```
feature/<short-description>
fix/<short-description>
docs/<short-description>
```

## Commit Conventions

Use [conventional commits](https://www.conventionalcommits.org/):

```
feat: add carer availability endpoint
fix: correct session expiry check
docs: add onboarding guide
refactor: extract org resolver middleware
```

## Pull Request Process

1. Branch from `main`
2. Keep PRs focused — one feature or fix per PR
3. Ensure all tests pass (`pnpm -F @repo/backend test`)
4. Ensure types check (`pnpm check-types`)
5. Request review

## Backend Module Pattern

Each feature lives in `apps/backend/src/modules/<name>/` with these files:

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript types for the module |
| `schemas.ts` | Fastify JSON Schema for request validation |
| `service.ts` | Business logic and Prisma queries (no Fastify types) |
| `controller.ts` | HTTP request/response handling, calls service |
| `routes.ts` | Registers Fastify routes, maps to controller handlers |

### Creating a New Module

1. Create the directory: `src/modules/<name>/`
2. Create all 5 files following the pattern above
3. Use Pattern A schemas (typed `FastifySchema`):
   ```typescript
   import type { FastifySchema } from 'fastify';

   export const createThingSchema: FastifySchema = {
     tags: ['Things'],
     body: { ... },
   };

   export const createThingOpts = { schema: createThingSchema };
   ```
4. Register routes in `server.ts` with the appropriate prefix
5. Add OpenAPI tags to all schema objects

### Schema Conventions

- Use `FastifySchema` type annotation (Pattern A) for new schemas
- Always include `tags: ['TagName']` for OpenAPI grouping
- Add `response` schemas for documented endpoints
- Use shared shapes from `src/schemas/common.ts` for error/message responses

## Middleware Chain

All org-scoped routes follow this pattern:

```
authenticate(app) -> orgScope -> authorize('permission.name')
```

## Database Changes

1. Edit `packages/db/prisma/schema.prisma`
2. Run `pnpm -F @repo/db db:generate` to regenerate the client
3. Run `pnpm -F @repo/db db:migrate` to create a migration
4. Update seed script if new roles/permissions are needed

## Testing

- Test framework: Vitest
- Test files go in `__tests__/` directories alongside the module
- Run: `pnpm -F @repo/backend test`
- Watch mode: `pnpm -F @repo/backend test:watch`
