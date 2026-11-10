# Relay frontend

The Relay web client is a React, TypeScript, and Vite application styled with Tailwind CSS v4.

## Structure

- `src/app/` contains the authenticated application shell and cross-feature composition.
- `src/features/` contains cohesive UI modules for authentication, dashboard, endpoints, and event history.
- `src/shared/` contains reusable presentation primitives.
- `src/lib/` contains shared API and formatting helpers.

The frontend is deployed and run as one application. Feature modules are boundaries within this single deployable, not separately deployed services.

## Development

The frontend expects the backend API on port `3000`. Configure `DATABASE_URL` in `backend/.env`, then start the backend from the repository's `backend` directory:

```sh
npm run dev
```

In a second terminal, install frontend dependencies and start Vite from this directory:

```sh
npm install
npm run dev
```

The Vite server proxies `/api` requests to `http://localhost:3000`. If the backend is stopped, API requests cannot be completed. Use `npm run build` to run the TypeScript build and create a production bundle, and `npm run lint` to run Oxlint.
