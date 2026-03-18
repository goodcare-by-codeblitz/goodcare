# ![Goodcare Logo](./logo.svg)

A compliant, audit-ready system for domiciliary care companies. Built as a monorepo with a Fastify REST API, Next.js web app, and Expo mobile app.

## Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Monorepo    | pnpm + Turborepo                     |
| Backend API | Fastify 5 (TypeScript)               |
| Web App     | Next.js 16 + React 19 + Tailwind CSS |
| Mobile App  | Expo / React Native                  |
| Database    | PostgreSQL 16 + Prisma ORM           |
| Job Queue   | BullMQ + Redis                       |
| Auth        | JWT + httpOnly cookies               |

## Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL 16+
- Redis 7+

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd goodcare
pnpm install

# 2. Configure environment
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env
# Edit both .env files with your values

# 3. Set up database
pnpm -F @repo/db db:generate
pnpm -F @repo/db db:migrate
pnpm -F @repo/db db:seed

# 4. Start dev servers
pnpm dev

# 5. Verify
curl http://localhost:3000/health
# Open http://localhost:3000/docs for Swagger UI
```

## Project Structure

```
goodcare/
  apps/
    backend/     Fastify REST API
    web/         Next.js web application
    mobile/      Expo React Native app (carers)
  packages/
    db/          Prisma client + PostgreSQL schema
    helpers/     Shared utilities (password hashing)
  docs/          Developer documentation
```

## Scripts

### Root (all workspaces via Turborepo)

```bash
pnpm dev             # Start all apps in dev mode
pnpm build           # Build all apps
pnpm check-types     # Typecheck all workspaces
```

### Backend

```bash
pnpm -F @repo/backend dev              # Dev server (port 3000)
pnpm -F @repo/backend build            # TypeScript compile
pnpm -F @repo/backend test             # Run tests
pnpm -F @repo/backend test:watch       # Watch mode
pnpm -F @repo/backend openapi:export   # Export OpenAPI JSON to stdout
```

### Database

```bash
pnpm -F @repo/db db:generate   # Regenerate Prisma client
pnpm -F @repo/db db:migrate    # Run migrations
pnpm -F @repo/db db:seed       # Seed roles, permissions, superadmin
pnpm -F @repo/db db:reset      # Reset database (destructive)
```

## Environment Variables

| Variable                      | Used by     | Description                  |
| ----------------------------- | ----------- | ---------------------------- |
| `DIRECT_URL`                  | db, backend | PostgreSQL connection string |
| `JWT_SECRET`                  | backend     | Signs JWTs                   |
| `COOKIE_SECRET`               | backend     | Signs cookies                |
| `PLATFORM_SUPERUSER_EMAIL`    | seed, auth  | Superadmin email             |
| `PLATFORM_SUPERUSER_PASSWORD` | seed        | Superadmin password          |
| `REDIS_URL`                   | backend     | Redis connection for BullMQ  |
| `SENDGRID_API_KEY`            | backend     | Email delivery               |
| `PORT`                        | backend     | Server port (default: 3000)  |

## API Documentation

In development, Swagger UI is available at `http://localhost:3000/docs`. The raw OpenAPI 3.0 JSON spec is at `/docs/json`.

To export the spec as a file:

```bash
pnpm -F @repo/backend openapi:export > openapi.json
```

## Testing

```bash
pnpm -F @repo/backend test        # Backend tests
pnpm -F @repo/helpers test         # Helper package tests
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines, module patterns, and PR process.

## License

MIT
