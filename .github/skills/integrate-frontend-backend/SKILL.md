---
name: integrate-frontend-backend
description: "Use when connecting the React dashboard to the Express API, changing API request/response types, implementing auth/session behavior, or debugging frontend-backend integration."
---

# Integrate Frontend and Backend

Keep the API contract consistent across React, TypeScript types, Express, validation, and documentation. Explain the end-to-end data flow before changing multiple layers.

## Project Context

- Frontend API helper: `frontend/src/lib/api.ts`.
- Frontend state and flow coordination: `frontend/src/App.tsx`.
- Frontend response/domain types: `frontend/src/types.ts`.
- Backend routes/controllers/services/repositories: `backend/src/modules/`.
- API middleware and response errors: `backend/src/app.ts` and `backend/src/middleware/error-handler.ts`.
- Local development uses Vite; inspect `frontend/vite.config.ts` before assuming proxy behavior.

## Procedure

1. Trace the existing user action through the UI handler, API helper, route, controller, service, repository, and response.
2. Identify and state the contract: method, path, auth requirement, request body, response envelope, HTTP status, and asynchronous states.
3. Explain the affected files and how the response will update UI state before implementing.
4. Make frontend types match actual backend JSON; avoid casts that hide mismatches.
5. Treat `202 Accepted` as queued work. Refresh or poll for eventual status rather than claiming delivery success immediately.
6. Handle network/API errors and expired authentication consistently. Preserve the shared 401 session-clearing behavior.
7. Keep authorization checks on the backend, including user-scoping records; never rely on frontend ownership checks.
8. Update API docs and relevant tests when the contract changes.
9. Validate with backend tests/typecheck and frontend lint/build, choosing the smallest relevant commands first.

## Asynchronous Delivery Notes

- The API process produces BullMQ jobs; a separate worker performs network delivery.
- A `PENDING` response is normal while the worker is processing or retrying.
- Delivery attempts and responses appear on the event detail/history UI after asynchronous updates.
- Redis and PostgreSQL are required for an end-to-end run. State clearly when validation covered only builds/tests because services were unavailable.
