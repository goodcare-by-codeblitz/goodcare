# BullMQ Email Queue with SendGrid

## Overview

Background email delivery using BullMQ + Redis, with SendGrid as the transport. BullMQ and SendGrid are intentionally isolated from business logic — they never appear in service files. The controller is the orchestration point that calls thin producer functions after service logic completes.

---

## New Dependencies

```bash
pnpm --filter @repo/backend add bullmq ioredis @sendgrid/mail fastify-plugin
```

---

## Environment Variables

Add to `apps/backend/.env`:

```
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

Start Redis locally (if no docker-compose exists):

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

---

## File Structure

### New files

```
apps/backend/
  src/
    lib/
      redis.ts                          ← shared IORedis connection (lazyConnect, maxRetriesPerRequest: null)
    jobs/
      job-types.ts                      ← EmailJobPayload discriminated union + EMAIL_QUEUE_NAME constant
      email-queue.ts                    ← BullMQ Queue instance + producer functions (only file importing Queue)
      email-worker.ts                   ← processEmailJob processor + createEmailWorker factory (only file importing Worker)
      email-worker.plugin.ts            ← Fastify plugin: starts worker, registers onClose hook
      __tests__/
        email-queue.test.ts             ← producer unit tests (mocks bullmq + redis)
        email-worker.test.ts            ← processor unit tests (mocks send-email, no Redis)
  utils/
    send-email.ts                       ← SendGrid implementation (was a console.log stub)
```

### Modified files

```
apps/backend/
  server.ts                             ← registers emailWorkerPlugin
  src/
    lib/                                ← (new directory)
    jobs/                               ← (new directory)
    modules/auth/
      auth.controller.ts                ← calls enqueueWelcomeEmail after register; adds forgotPasswordController
      auth.routes.ts                    ← adds POST /forgot-password route
      auth.schemas.ts                   ← adds forgotPasswordSchema / forgotPasswordOpts
      auth.service.ts                   ← adds forgotPasswordService (zero BullMQ imports)
      auth.types.ts                     ← adds ForgotPasswordBody / Input / Result types
      __tests__/
        auth.controller.test.ts         ← mocks email-queue module; adds forgot-password tests
    test/
      setup.ts                          ← adds REDIS_URL, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL env vars
packages/db/
  prisma/schema.prisma                  ← adds PasswordResetToken model
```

---

## Architecture

### Redis connection (`src/lib/redis.ts`)

Single `ioredis` `Redis` instance shared across the app. Queue and Worker each call `.duplicate()` on it — BullMQ requires separate connections per Queue/Worker.

```ts
export const redisConnection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // BullMQ requirement
  enableReadyCheck: false,
  lazyConnect: true,
});
```

### Job types (`src/jobs/job-types.ts`)

Discriminated union drives the `switch` in the worker processor:

```ts
export type EmailJobPayload = WelcomeEmailPayload | PasswordResetEmailPayload;
```

Each payload has a `type` field (`'welcome'` | `'password_reset'`).

### Email queue (`src/jobs/email-queue.ts`)

**The only file that imports `Queue` from `bullmq`.** Controllers never touch `Queue` directly — they call the named producer functions:

- `enqueueWelcomeEmail(payload)`
- `enqueuePasswordResetEmail(payload)`

Default job options: 3 attempts, exponential backoff (5 s base), keep last 100 completed / 500 failed.

### Email worker (`src/jobs/email-worker.ts`)

**The only file that imports `Worker` from `bullmq`.**

- `processEmailJob(job)` — exported separately for unit testing without a real Redis connection.
- `createEmailWorker()` — called only by the Fastify plugin. Concurrency: 5.
- Includes a TypeScript exhaustiveness check on the `switch` default branch.

### Fastify plugin (`src/jobs/email-worker.plugin.ts`)

Wraps the worker lifecycle inside Fastify:
- Starts the worker on plugin registration.
- Logs `'Email job completed'` / `'Email job failed'` events.
- Registers an `onClose` hook that calls `worker.close()` and `emailQueue.close()` for graceful shutdown.

Registered in `server.ts` with `app.register(emailWorkerPlugin)`.

### SendGrid transport (`utils/send-email.ts`)

Replaced the `console.log` stub with a real `@sendgrid/mail` call. Signature changed from sync `void` to `async Promise<void>`. The worker awaits it.

---

## Data Flow

```
POST /auth/register
  └─► registerController
        ├─ registerService()          ← pure business logic
        ├─ setAuthCookies()
        ├─ enqueueWelcomeEmail()      ← producer only, no BullMQ in controller
        └─ reply.send(200)

POST /auth/forgot-password
  └─► forgotPasswordController
        ├─ forgotPasswordService()    ← looks up user, generates token, stores hash in DB
        ├─ enqueuePasswordResetEmail()
        └─ reply.send(200)           ← always 200 (enumeration-safe)

Redis BullMQ Queue "email"
  └─► email-worker.ts (Worker, concurrency: 5)
        └─ processEmailJob(job)
             └─ sendEmail()          ← SendGrid via @sendgrid/mail
```

---

## Database

A `PasswordResetToken` model was added to `packages/db/prisma/schema.prisma`:

| Field      | Type       | Notes                     |
|------------|------------|---------------------------|
| id         | String     | UUID PK                   |
| userId     | String     | FK → User                 |
| tokenHash  | String     | Unique HMAC-SHA256 hash   |
| expiresAt  | DateTime   | 1 hour from creation      |
| usedAt     | DateTime?  | Set when token is consumed|
| createdAt  | DateTime   | auto                      |

Run after schema change:
```bash
pnpm -F @repo/db db:generate
pnpm -F @repo/db db:migrate
```

---

## Testing Strategy

| Test file | What it tests | Key mocks |
|---|---|---|
| `auth.controller.test.ts` | HTTP contract for register + forgot-password endpoints | `auth.service`, `jobs/email-queue` |
| `email-queue.test.ts` | Producer functions call `queue.add()` with correct payload | `bullmq` (Queue), `lib/redis` |
| `email-worker.test.ts` | `processEmailJob` sends correct email per job type; exhaustiveness check | `utils/send-email` |

The `processEmailJob` function is exported separately from the `Worker` factory so it can be unit-tested without opening a Redis connection.

---

## Verification

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 2. Set env vars in apps/backend/.env
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG.your-real-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# 3. Run database migration
pnpm -F @repo/db db:migrate

# 4. Start the backend
pnpm -F @repo/backend dev

# 5. Test endpoints
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Alice","lastName":"Smith","email":"alice@example.com","password":"password123","organizationName":"Acme Care","slug":"acme-care"}'

curl -X POST http://localhost:3000/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com"}'

# 6. Run tests
pnpm --filter @repo/backend test
```

Check server logs for `Email job completed` and verify inbox.
