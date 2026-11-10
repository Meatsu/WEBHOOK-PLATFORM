---
name: implement-background-jobs
description: "Use when adding or changing Redis/BullMQ queues, producers, workers, retries, delayed jobs, recovery, or graceful shutdown in the Webhook Platform."
---

# Implement Background Jobs

Keep API producers and workers in the same repository but as separate processes. Explain queue concepts and failure behavior before implementing asynchronous work.

## Project Context

- Queue/Redis connection: `backend/src/infrastructure/queue/redis.ts`.
- Delivery producer and shared job options: `backend/src/modules/webhooks/delivery-queue.ts`.
- Delivery worker logic: `backend/src/modules/webhooks/delivery-worker.ts`.
- Worker process entry point: `backend/src/worker.ts`.
- API process entry point and shutdown: `backend/src/server.ts`.
- PostgreSQL/Prisma is the durable application record; Redis/BullMQ schedules execution.
- Run locally with backend `npm run dev` and, in a separate terminal, `npm run dev:worker`. Production scripts are `npm run start` and `npm run worker`.

## Procedure

1. Define the job payload as small, serializable identifiers; load authoritative data from the database in the worker.
2. Explain producer, queue, worker, retry, duplicate delivery, and shutdown behavior, and list files before editing.
3. Persist the business record before enqueueing. Surface queue failures explicitly and retain a visible failure state.
4. Use deterministic job IDs or equivalent idempotent enqueueing when reconciling records. A DB transaction cannot atomically commit to Redis.
5. Configure bounded attempts and exponential backoff; classify retryable versus permanent errors. Never retry invalid destinations indefinitely.
6. Record each execution separately, including response code/body, error, duration, and timestamp. Maintain the overall job status consistently.
7. Design recovery for the gap between persistence and enqueue, and for process restarts. Avoid duplicate active jobs during reconciliation.
8. Implement graceful shutdown: stop accepting work, close BullMQ resources, wait for in-flight recovery/processing, then disconnect Prisma.
9. Log actionable failures without secrets or unbounded response content.
10. Validate with backend build/typecheck/tests. If Redis is available, also run the worker and test a pending job; clearly distinguish compile validation from a live integration test.

## Delivery Semantics

- HTTP delivery is at-least-once, not exactly-once. A worker can lose its process after the receiver accepts a request but before recording success.
- Reuse a stable delivery identifier in the outbound `X-Webhook-Delivery-Id` header so receivers can deduplicate.
- `202 Accepted` means queued. The worker eventually sets the database delivery status.
- Preserve `PENDING` while an automatic retry is scheduled; use `FAILED` when no automatic retries remain.
