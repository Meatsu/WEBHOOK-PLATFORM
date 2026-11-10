# Webhook Platform

Webhook Platform provides a React dashboard and an Express API for managing webhook endpoints, sending test events, and reviewing delivery history. The backend is a modular monolith backed by PostgreSQL and Prisma.

## Project structure

```text
backend/
  prisma/                 Prisma schema and database migrations
  src/
    app.ts                 Express app and API module registration
    server.ts              API process entry point
    infrastructure/        Shared database connection
    middleware/            Shared HTTP error handling
    modules/
      auth/                Registration, login, logout, sessions
      webhooks/            Endpoint CRUD and test event delivery/history
frontend/
  src/                     React dashboard
  vite.config.ts           Local development proxy to the API
postman/collections/       Postman API collection
```

## Requirements

- Node.js and npm
- PostgreSQL
- Redis

## Configure and run the backend

From `backend/`, copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_URL`, and a `JWT_SECRET` with at least 32 bytes. `PORT` defaults to `3000`; `TRUST_PROXY_HOPS` defaults to `0` and should match the exact trusted reverse-proxy hop count so rate limits use the client address accurately.

```sh
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Start the API and worker in separate terminals from `backend/`:

```sh
npm run dev:worker
```

The API runs at `http://localhost:3000` by default. For production, configure the environment and run `npm run db:deploy` before starting the backend; run `npm run start` and `npm run worker` as separate processes. Production requests must use HTTPS.

## Run the frontend

In a separate terminal, from `frontend/`:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The Vite development server forwards `/api` requests to `http://localhost:3000`; start the backend as well. The frontend also provides `npm run build`, `npm run lint`, and `npm run preview` scripts.

The dashboard supports account registration and login, endpoint management, sending JSON test events, and viewing delivery history and response details. The access token and basic user data are kept in browser `sessionStorage` and cleared on logout.

## API

All endpoints except registration and login require `Authorization: Bearer <access-token>`. Access tokens expire after 15 minutes and are persisted as revocable sessions. Request and API errors use `{ "status": false, "message": "..." }` responses.

### Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account and return the user and access token |
| POST | `/api/auth/login` | Authenticate and return the user and access token |
| POST | `/api/auth/logout` | Revoke the current session |

Registration and login are rate limited. Registration requires a valid email and a password of at least 12 characters.

### Webhook endpoints

All routes below require authentication and only access endpoints owned by the current user.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/webhooks` | List the current user's endpoints |
| POST | `/api/webhooks` | Create an endpoint with `name` and `targetUrl` |
| GET | `/api/webhooks/:id` | Get one endpoint |
| PATCH | `/api/webhooks/:id` | Update `name` and/or `targetUrl` |
| DELETE | `/api/webhooks/:id` | Delete an endpoint |
| POST | `/api/webhooks/:id/test-events` | Queue a JSON test payload for delivery (202 Accepted) |

Test-event request body:

```json
{
  "payload": {
    "event": "order.created",
    "data": { "orderId": "ord_123" }
  }
}
```

The payload must be a JSON object. Test events are rate limited to 10 requests per minute per client. The API records each event as pending and enqueues it in BullMQ; the separate worker sends the request to public HTTP(S) destinations on standard ports. The worker periodically reconciles pending database records with Redis so an API/worker restart does not leave an event unpublished. Private, local, and reserved addresses are blocked, and every resolved DNS address must be public. Requests have an 8-second timeout, a 4 KB response-body limit, and at most three total attempts with exponential backoff for network errors, HTTP 408/425/429, and HTTP 5xx responses.

### Delivery history

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/events` | List up to the latest 100 deliveries for the current user |
| GET | `/api/events/:id` | Get delivery details, payload, response, and all attempt records |
| POST | `/api/events/:id/retry` | Manually queue a failed delivery again (202 Accepted; 10 requests/minute) |

Delivery statuses are `PENDING`, `SUCCEEDED`, and `FAILED`. HTTP 4xx responses other than 408, 425, and 429 are not retried automatically. Only failed deliveries can be manually retried. Delivery is at-least-once: a worker crash after the receiver accepts a request but before the database records the response can result in a duplicate request. Retries reuse the `X-Webhook-Delivery-Id` header, which receivers can use as an idempotency key. The event history shows each attempt and response. History is retained when its webhook endpoint is deleted; the endpoint reference is cleared while the stored endpoint name and target URL remain in the delivery record.

## Postman

Import `postman/collections/webhook-platform.postman_collection.json` into Postman. The collection includes the local API URL and example credentials; registration and login requests save the returned token for authenticated requests.
