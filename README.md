# Webhook Platform

The backend is organized as a modular monolith: one deployable application with
feature modules that own their HTTP routes, application logic, validation, and
persistence access.

## Backend layout

```text
backend/src/
  app.ts                         HTTP app and module registration
  server.ts                      Process entry point
  infrastructure/database/       Shared Prisma client
  modules/
    auth/                        Authentication feature module
      auth.routes.ts
      auth.controller.ts
      auth.service.ts
      auth.repository.ts
      auth.schemas.ts
      auth.middleware.ts
      auth.token.ts
    webhooks/                    User-owned webhook endpoint CRUD
      webhook.routes.ts
      webhook.controller.ts
      webhook.repository.ts
      webhook.schemas.ts
```

`app.ts` is the composition root: mount new feature modules there. A module
should keep its internals private and expose only what the application needs
(currently, the auth router). Feature code accesses the database through its
own repository and the shared Prisma infrastructure; modules should not import
another module's internal files directly.

## Run the backend

From `backend/`, copy `.env.example` to `.env`, configure `DATABASE_URL` and a
`JWT_SECRET` containing at least 32 bytes, then run:

```sh
npm install
npm run dev
```

The auth endpoints remain under `/api/auth` (`/register`, `/login`, and
authenticated `/logout`). Access tokens are persisted as revocable sessions and
expire after 15 minutes.

## Database setup

From `backend/`, configure `DATABASE_URL` and `JWT_SECRET` in `.env`, then run:

```sh
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

For production deployments, run `npm run db:deploy` before starting the API.

## API

All webhook routes require `Authorization: Bearer <access-token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register and receive an access token |
| POST | `/api/auth/login` | Log in and receive an access token |
| POST | `/api/auth/logout` | Revoke the current access-token session |
| GET | `/api/webhooks` | List the authenticated user's webhook endpoints |
| POST | `/api/webhooks` | Create an endpoint (`name`, `targetUrl`) |
| GET | `/api/webhooks/:id` | Get one endpoint owned by the authenticated user |
| PATCH | `/api/webhooks/:id` | Update its `name` and/or `targetUrl` |
| DELETE | `/api/webhooks/:id` | Delete an endpoint owned by the authenticated user |

Target URLs are stored as endpoint configuration; this API does not dispatch
webhook requests. Resource lookups and mutations are scoped to the current user.
Validation and API errors return a consistent `{ "status": false, "message":
"..." }` response shape.

Import `postman/collections/webhook-platform.postman_collection.json` in
Postman. Its collection variables include the local API URL and example
credentials; registration/login requests save the returned token for protected
requests.