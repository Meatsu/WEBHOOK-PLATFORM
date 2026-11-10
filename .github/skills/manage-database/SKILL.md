---
name: manage-database
description: "Use when changing Prisma models, PostgreSQL schema, migrations, generated client, relations, indexes, or database setup for the Webhook Platform."
---

# Manage the Database

Make database changes through Prisma schema and tracked migrations. Explain schema impact and migration steps before editing; preserve existing data unless the user explicitly approves destructive changes.

## Project Context

- Prisma schema: `backend/prisma/schema.prisma`.
- Migration history: `backend/prisma/migrations/`.
- Prisma 7 config: `backend/prisma7.config.ts`.
- Client generation: `npm run db:generate` from `backend/`; generated client is in `backend/generated/prisma/`.
- Database client and PostgreSQL adapter: `backend/src/infrastructure/database/prisma.ts`.
- Prisma 7 datasource connection is configured in the project config/environment; inspect it rather than assuming an inline schema URL.

## Procedure

1. Read the current model, relevant migrations, Prisma config, repository queries, and tests.
2. Explain the model/relation change, migration implications, and affected files.
3. Edit the Prisma schema and create a new forward-only migration; do not rewrite applied migrations.
4. Preserve referential integrity and existing history. Add indexes for actual query patterns when justified.
5. Regenerate the client with `npm run db:generate`.
6. Validate with `npx prisma validate`, `npm run typecheck`, and relevant backend tests.
7. Apply a development migration with `npm run db:migrate` only when the configured database is available and the user wants it applied. Do not imply it has been applied merely because a migration file exists.
8. Document required deployment/setup steps.

## Delivery Data Notes

- A `Delivery` is the overall event and can move through `PENDING`, `SUCCEEDED`, and `FAILED`.
- `DeliveryAttempt` stores a distinct worker execution and its response/error. Do not overwrite or delete prior attempts when manually retrying.
- A webhook relation may be cleared when an endpoint is deleted while delivery history remains; keep stored endpoint name and target URL semantics intact.
- Redis/BullMQ state and PostgreSQL delivery state are separate. Do not assume a DB write and Redis enqueue are one atomic transaction; preserve reconciliation/recovery behavior.
