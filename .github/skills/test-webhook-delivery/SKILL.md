---
name: test-webhook-delivery
description: "Use when writing tests or performing manual verification for webhook payload validation, public URL/DNS safety, queued delivery, retries, attempt history, or manual retry."
---

# Test Webhook Delivery

Verify delivery behavior at the layer that matters, and explain the expected outcome. Do not send requests to real third-party destinations without explicit authorization.

## Project Context

- Payload and ID validation: `backend/src/modules/webhooks/delivery.schemas.ts`.
- Outbound HTTP, timeout, DNS/IP validation: `backend/src/modules/webhooks/webhook-delivery.ts`.
- Queue and worker behavior: `delivery-queue.ts`, `delivery-worker.ts`, and `worker.ts` in the same module/process structure.
- API contract: authenticated `POST /api/webhooks/:id/test-events`, event history at `/api/events`, and manual retry at `/api/events/:id/retry`.
- Delivery attempt history is persisted by Prisma and shown in the frontend event details.

## Test Procedure

1. Read current tests and behavior before adding cases. Keep tests focused and safe; prefer local/fake receivers and controlled DNS/network seams over public endpoints.
2. Validate payload boundaries: accept a nested JSON object; reject null, arrays, and primitives.
3. Validate destination policy: permit public IPv4/global IPv6; reject loopback, private, link-local, reserved, mapped/non-public addresses, empty answers, and any DNS result set containing a blocked address.
4. Validate HTTP behavior: response status/body capture, maximum response size, total request timeout, and transport/network failure.
5. Validate retry classification: network errors and HTTP 408/425/429/5xx are retryable; other 4xx responses are terminal.
6. Verify each worker execution appends an attempt record; ensure final status matches pending/retrying/success/failure semantics.
7. Verify manual retry is allowed only for a failed delivery owned by the authenticated user, is rate-limited, and preserves earlier attempts.
8. Run `npm test` and `npm run typecheck` in `backend/`; run frontend lint/build for UI changes.
9. For end-to-end verification, require configured PostgreSQL and Redis, start `npm run dev` and `npm run dev:worker` in separate terminals, and use only a local test receiver.
10. State which checks actually ran. Do not claim worker integration passed if Redis/database services were not available.

## Safety and Reliability

- Every resolved address must be checked before opening a socket. Pin the outbound connection to a verified result to prevent a second DNS lookup from changing the destination.
- Never follow redirects unless each redirect target is revalidated under the same policy.
- Keep test payloads and endpoint responses bounded; avoid logging credentials, tokens, or sensitive payload data.
- Delivery uses at-least-once semantics. A receiver may see duplicates; test/document the delivery ID as its idempotency key.
