---
name: build-rest-api
description: "Use when adding or changing Express REST API routes, controllers, validation, authentication, rate limiting, or error responses in the Webhook Platform backend."
---

# Build the REST API

Implement API behavior in the existing modular Express backend. Explain the purpose and request flow before editing, validate inputs at the boundary, and keep authorization and errors explicit.

## Project Context

- `backend/src/app.ts` registers middleware and modules.
- Modules live in `backend/src/modules/`; authentication is in `auth/`, webhooks and event history are in `webhooks/`.
- Typical flow: `*.routes.ts` → `*.controller.ts` → service/repository → Prisma.
- Zod request schemas and schema tests are colocated with their modules.
- Shared API errors and final response formatting live in `backend/src/middleware/error-handler.ts`.
- Authentication middleware supplies `req.user`; every user-owned resource query must be scoped to that user.

## Procedure

1. Inspect the nearest existing route, controller, schema, repository, tests, and docs; identify the request and response contract.
2. Explain the feature, affected files, approach, and key concepts before implementation.
3. Add or update Zod validation and return clear `400` responses for invalid inputs.
4. Require authentication for private operations and scope reads, updates, deletes, and retries by the authenticated user ID.
5. Keep controllers focused on HTTP concerns; place reusable business rules in a service and persistence operations in a repository.
6. Use the existing `ApiError`/error-handler conventions. Do not swallow unexpected errors or return success-shaped fallbacks.
7. Add targeted tests for accepted/rejected input and important ownership/state conditions.
8. Update `README.md` when endpoint behavior, status codes, limits, or setup requirements change.
9. Run `npm run typecheck` and `npm test` from `backend/`; run `npm run build` when verifying production compilation.

## Delivery API Contract

- `POST /api/webhooks/:id/test-events` queues a delivery and returns `202 Accepted`.
- `GET /api/events` and `GET /api/events/:id` are authenticated and user-scoped.
- `POST /api/events/:id/retry` queues a retry only for a failed delivery and returns `202 Accepted`.
- A queued response is not a delivery-success response. The worker updates status and attempt records later.
- Respect existing rate limits and public-destination restrictions; do not make a new route that bypasses them.
