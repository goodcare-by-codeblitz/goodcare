# Developer Onboarding

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | [nodejs.org](https://nodejs.org/) or `nvm install 22` |
| pnpm | 10+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| PostgreSQL | 16+ | [postgresql.org](https://www.postgresql.org/download/) |
| Redis | 7+ | [redis.io](https://redis.io/download/) |

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd goodcare
pnpm install
```

### 2. Environment Configuration

```bash
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env
```

Edit `packages/db/.env`:
```
DIRECT_URL="postgresql://user:password@localhost:5432/goodcare"
```

Edit `apps/backend/.env`:
```
JWT_SECRET="your-secret-min-32-chars"
COOKIE_SECRET="your-cookie-secret"
PLATFORM_SUPERUSER_EMAIL="admin@example.com"
PLATFORM_SUPERUSER_PASSWORD="securepassword"
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm -F @repo/db db:generate

# Run migrations
pnpm -F @repo/db db:migrate

# Seed initial data (roles, permissions, superadmin user)
pnpm -F @repo/db db:seed
```

### 4. Start Dev Servers

```bash
# Start all apps
pnpm dev

# Or just the backend
pnpm -F @repo/backend dev
```

### 5. Verify Setup

```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"okay","timestamp":"..."}
```

Open http://localhost:3000/docs to see the Swagger UI with all API endpoints.

### 6. Run Tests

```bash
pnpm -F @repo/backend test
pnpm -F @repo/helpers test
```

## Project Structure

```
goodcare/
  apps/
    backend/           Fastify REST API
      server.ts        App entry point, plugin and route registration
      src/
        modules/       Feature modules (auth, organisation, patient, etc.)
        plugins/       Fastify plugins (swagger)
        middleware/     Auth, org scope, authorization
        schemas/       Shared schema shapes
        lib/           Error classes, utilities
        jobs/          BullMQ workers (email queue)
      utils/           Helper functions
      scripts/         CLI scripts (OpenAPI export)
    web/               Next.js frontend
    mobile/            Expo React Native app
  packages/
    db/                Prisma schema, client, migrations, seed
    helpers/           Shared utilities (bcrypt wrappers)
```

## Backend Module Pattern

Each module in `src/modules/<name>/` follows a 5-file structure:

- **`types.ts`** — TypeScript interfaces and types
- **`schemas.ts`** — Fastify JSON Schema validation (request body, params, querystring)
- **`service.ts`** — Business logic and database queries. No Fastify types here.
- **`controller.ts`** — Handles HTTP layer: parses request, calls service, sends response
- **`routes.ts`** — Registers routes on the Fastify instance with schemas and handlers

### Example: Reading the auth module

1. `auth.routes.ts` registers `POST /register` with `registerOpts` schema and `registerController`
2. `auth.schemas.ts` defines `registerSchema` with body validation rules
3. `auth.controller.ts` extracts body fields, calls `authService.register()`, sets cookies
4. `auth.service.ts` hashes password, creates user + org in the database
5. `auth.types.ts` defines `RegisterBody`, `LoginBody`, etc.

## Authentication Flow

1. **Register/Login**: Creates a `Session` row with a hashed refresh token. Sets two httpOnly cookies: `access_token` (10 min) and `refresh_token` (30 days, scoped to `/auth/refresh`).
2. **Authenticated requests**: The `authenticate` middleware verifies the `access_token` cookie and populates `request.user`.
3. **Token refresh**: `POST /auth/refresh` verifies the refresh cookie, rotates the session, and issues new tokens.
4. **Logout**: Deletes all sessions for the user, clears cookies.

## Common Tasks

### Add a new API endpoint

1. Add the schema to `schemas.ts` with a `tags` array
2. Add the service function to `service.ts`
3. Add the controller function to `controller.ts`
4. Register the route in `routes.ts`

### Add a database migration

1. Edit `packages/db/prisma/schema.prisma`
2. `pnpm -F @repo/db db:generate`
3. `pnpm -F @repo/db db:migrate`

### Add a new permission

1. Add to the seed script in `packages/db/`
2. Run `pnpm -F @repo/db db:seed`
3. Use `authorize('your.permission')` middleware in routes
