---
name: debug-backend
description: "Use when diagnosing Express API, Prisma/PostgreSQL, Redis/BullMQ worker, authentication, or webhook-delivery failures in this repository."
---

# Debug the Backend

Diagnose from evidence before changing code. Explain the observed failure, likely cause, and files involved in beginner-friendly language; do not hide errors or make unrelated changes.

## Project Context

- Express app/middleware: `backend/src/app.ts` and `backend/src/middleware/`.
- API process: `backend/src/server.ts`.
- Auth and webhook modules: `backend/src/modules/auth/` and `backend/src/modules/webhooks/`.
- PostgreSQL/Prisma client: `backend/src/infrastructure/database/prisma.ts`.
- Redis connection and queue producer: `backend/src/infrastructure/queue/redis.ts` and `backend/src/modules/webhooks/delivery-queue.ts`.
- Worker process and job handler: `backend/src/worker.ts` and `backend/src/modules/webhooks/delivery-worker.ts`.
- Environment template: `backend/.env.example`; never print or expose actual `.env` secrets.

## Procedure

1. Reproduce the failure or inspect the reported output and identify which process failed: API, worker, database, Redis, or outbound receiver.
2. Check environment names and service availability without revealing secret values. Required services for delivery are PostgreSQL and Redis.
3. Trace the path from route through controller/service/repository or producer through queue/worker and DB update.
4. Check whether the API returned an error, a `202` queued response, or a stale frontend state; `202` does not mean delivery succeeded.
5. Inspect current delivery status, attempt records, queue/worker logs, and timestamps. Do not infer a delivery attempt exists if none was recorded.
6. Run the smallest relevant verification first: backend `npm test`, `npm run typecheck`, `npm run build`, and Prisma validation as appropriate.
7. For Redis issues, verify `REDIS_URL` protocol/host/port/database and that both API and worker use the intended Redis instance.
8. For DB/schema errors, check migration state and generated client. Do not edit old migrations or apply a migration to an unknown/production database.
9. For delivery errors, distinguish invalid target policy, DNS lookup, timeout/network, HTTP response, Redis enqueue, and persistence failures.
10. Implement a focused fix only after identifying the root cause; add a regression test and report validation limits explicitly.

## Operational Notes

- API and worker run as separate processes. Both need the correct environment.
- A pending event is queued/in progress or awaiting recovery; the worker periodically reconciles pending database records with Redis.
- Automatic retries are bounded and use exponential backoff. Manual retry is for failed events only.
- Graceful shutdown should close the HTTP server or BullMQ worker/queue and then disconnect Prisma.
- Delivery is at-least-once; duplicate receiver requests are possible after a crash. `X-Webhook-Delivery-Id` supports receiver-side deduplication.
