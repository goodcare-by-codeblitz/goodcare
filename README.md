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

## Local Development with Docker

Docker Compose provides a fully containerized local development environment with all required services (backend, PostgreSQL, Redis) orchestrated together.

### Prerequisites

- Docker installed and running on your system
- Docker Compose v2.0+ (included with Docker Desktop)
- At least 2GB of available RAM allocated to Docker

### Quick Start with Docker

**1. Clone the repository and set up environment variables:**

```bash
git clone <repo-url> && cd goodcare
cp .env.example .env
# Edit .env with any custom values (defaults are suitable for local development)
```

**2. Start all services:**

```bash
docker compose up --build
```

This command:

- Builds the backend Docker image (multi-stage: dev stage for hot-reload)
- Starts PostgreSQL with persistent data storage
- Starts Redis for job queues
- Runs database migrations and seeds initial data (roles, permissions, superadmin)
- Starts the Fastify backend server on port 3000

**3. Verify everything is working:**

```bash
# Check services are running
docker compose ps

# View backend logs
docker compose logs -f backend

# Test backend health
curl http://localhost:3000/v1/health

# Access Swagger UI
open http://localhost:3000/documentation
```

### Services Overview

| Service      | Image              | Port (internal) | Port (exposed) | Purpose                         |
| ------------ | ------------------ | --------------- | -------------- | ------------------------------- |
| **postgres** | postgres:17-alpine | 5432            | —              | PostgreSQL database             |
| **redis**    | redis:8-alpine     | 6379            | —              | Job queue & caching             |
| **db-init**  | backend:latest     | —               | —              | Migrations & seeding (one-shot) |
| **backend**  | backend:dev        | 3000            | 3000           | Fastify API server              |

**Network:** All services communicate via internal Docker network (`goodcare_network`). Service names (e.g., `postgres:5432`, `redis:6379`) are automatically resolved via Docker DNS.

**Volumes:**

- `postgres_data` — PostgreSQL data persists across `docker compose down/up` cycles
- `redis_data` — Redis data (optional, can be removed)
- Backend source code mounted for hot-reload in development

### Common Commands

```bash
# View all running services
docker compose ps

# Stream logs from all services
docker compose logs -f

# Stream logs from a specific service
docker compose logs -f backend
docker compose logs -f postgres

# Enter database shell
docker compose exec postgres psql -U postgres -d goodcare

# Run a one-time command in backend
docker compose run backend npx tsx scripts/export-openapi.ts

# Stop all services (keep data)
docker compose stop

# Stop and remove containers (keep volumes)
docker compose down

# Stop, remove containers, AND remove volumes (destructive)
docker compose down -v

# Rebuild image after code changes (optional—hot-reload usually suffices)
docker compose build

# Force rebuild without cache
docker compose build --no-cache
```

### Environment Variables in Docker

All services read from the `.env` file at the repository root. Key variables:

| Variable                      | Purpose                      | Default                                                 |
| ----------------------------- | ---------------------------- | ------------------------------------------------------- |
| `DIRECT_URL`                  | PostgreSQL connection string | `postgresql://postgres:postgres@postgres:5432/goodcare` |
| `REDIS_URL`                   | Redis connection string      | `redis://redis:6379`                                    |
| `JWT_SECRET`                  | JWT signing key              | (required; generate with `openssl rand -base64 32`)     |
| `COOKIE_SECRET`               | Cookie signing key           | (required; generate with `openssl rand -base64 32`)     |
| `PORT`                        | Backend port                 | `3000`                                                  |
| `BACKEND_PORT`                | Host port mapping            | `3000`                                                  |
| `PLATFORM_SUPERUSER_EMAIL`    | Seed superadmin email        | `admin@goodcare.local`                                  |
| `PLATFORM_SUPERUSER_PASSWORD` | Seed superadmin password     | (required; change in production)                        |

See `.env.example` for complete configuration options and documentation.

### Database Initialization

On first startup, the `db-init` service automatically:

1. Waits for PostgreSQL to be healthy
2. Generates the Prisma client
3. Runs pending database migrations
4. Seeds initial data (roles, permissions, superadmin account)

**Subsequent starts** only apply new migrations; seeding does not repeat.

To manually trigger migrations or seeding:

```bash
# Run migrations
docker compose exec backend pnpm -F @repo/db db:migrate

# Seed database
docker compose exec backend pnpm -F @repo/db db:seed

# Regenerate Prisma client
docker compose exec backend pnpm -F @repo/db db:generate
```

### Troubleshooting

**Port conflicts (3000, 5432, 6379 already in use)**

```bash
# Find which process is using the port (macOS/Linux)
lsof -i :3000

# Change port in .env
BACKEND_PORT=3001
POSTGRES_PORT=5433
REDIS_PORT=6380

# Then restart
docker compose up
```

**Database connection refused / migration failures**

```bash
# Check db-init logs
docker compose logs db-init

# Ensure postgres service is healthy
docker compose ps

# Reset database (destructive—removes all data)
docker compose down -v
docker compose up --build
```

**Redis connection issues**

```bash
# Check redis service logs
docker compose logs redis

# Verify Redis is responding
docker compose exec redis redis-cli ping
# Should respond with PONG
```

**Container startup failures**

```bash
# View all service logs
docker compose logs

# View specific service logs with more context
docker compose logs --tail=50 backend

# Check docker daemon is running
docker ps
```

**Backend crashes after start**

```bash
# Check backend logs for detailed error
docker compose logs backend

# Common causes:
# - JWT_SECRET or COOKIE_SECRET not set in .env
# - PostgreSQL migrations failed (check db-init logs)
# - Redis connection issue (check REDIS_URL format)
```

**Rebuild and restart after code changes**

```bash
# For most changes, hot-reload via volume mounts works automatically
# If you add new dependencies or change configuration:
docker compose build
docker compose up
```

### Advanced Usage

**Running tests in Docker**

```bash
docker compose run backend pnpm -F @repo/backend test
```

**Exporting OpenAPI specification**

```bash
docker compose run backend pnpm -F @repo/backend openapi:export > openapi.json
```

**Using a specific version of Node.js**

Edit `apps/backend/Dockerfile` and change the base image:

```dockerfile
FROM node:22-alpine AS dev    # Change to desired version
```

Then rebuild: `docker compose build`

**Developing without Docker (manual services)**

If you prefer running services manually:

```bash
# Terminal 1: PostgreSQL
docker run -d --name pgdev -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine

# Terminal 2: Redis
docker run -d --name redisdev -p 6379:6379 redis:8-alpine

# Terminal 3: Backend (local Node.js)
pnpm dev
```

### Data Persistence

- **PostgreSQL data** is stored in the `postgres_data` volume (persists across `docker compose down` unless `-v` flag is used)
- **Redis data** is stored in the `redis_data` volume (optional; can exist without persistence)

To reset everything:

```bash
docker compose down -v  # Remove volumes
docker compose up --build  # Recreate from scratch
```

### Performance Optimization

For better performance on Docker Desktop (Mac/Windows):

```bash
# Increase Docker Desktop resource allocation
# In Docker Desktop settings:
# - CPUs: 4+
# - Memory: 4GB+
# - Disk image size: 50GB+
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
