---
name: understand-code
description: "Use when exploring or explaining this Webhook Platform codebase, tracing a feature across frontend, API, database, and worker, or orienting before a change."
---

# Understand This Codebase

Use this skill to explain how existing code works before changing it. The user is learning, so explain unfamiliar terms and connect each file to the request flow.

## Project Map

- `frontend/src/`: React 19 + TypeScript + Vite dashboard; `App.tsx` owns application state and calls the shared API helper in `lib/api.ts`.
- `backend/src/app.ts`: Express app, middleware, and API module registration.
- `backend/src/server.ts`: API process entry point and shutdown handling.
- `backend/src/modules/auth/`: registration, login, JWT verification, and revocable sessions.
- `backend/src/modules/webhooks/`: webhook CRUD, delivery API, queue producer, worker logic, and delivery validation.
- `backend/src/worker.ts`: separate BullMQ delivery-worker process.
- `backend/src/infrastructure/database/prisma.ts`: Prisma client configured with the PostgreSQL adapter.
- `backend/src/infrastructure/queue/redis.ts`: Redis connection settings.
- `backend/prisma/schema.prisma` and `backend/prisma/migrations/`: database models and schema history.
- `README.md`: setup, API contract, and operational instructions.

## Procedure

1. Restate the behavior or question in plain language.
2. Locate the entry point, then trace the request/data flow through the relevant layers. For a test delivery, follow the route/controller → service/queue → worker → delivery transport → repository/database → frontend history.
3. Read the actual implementation and nearby tests/docs before describing behavior. Do not infer behavior from filenames or promises.
4. Explain the responsibility of each relevant file and how data moves between them.
5. Separate confirmed behavior from assumptions or missing evidence; call out external requirements such as PostgreSQL or Redis.
6. If a change is requested, first explain its purpose, affected files, approach, and concepts; then make a focused change and validate it.

## Project Conventions

- Backend uses strict TypeScript, Express 5, Zod, Prisma 7, PostgreSQL, Redis, and BullMQ.
- Frontend uses React and TypeScript with Tailwind CSS; use existing components, props, and API helper.
- Keep authorization and ownership checks on the server. Client-side state is not an access-control boundary.
- Check current package scripts instead of guessing command names.
- Do not claim a behavior works unless a relevant test/build or runtime check verifies it.
