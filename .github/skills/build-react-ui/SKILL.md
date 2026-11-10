---
name: build-react-ui
description: "Use when implementing, updating, or debugging React UI in the Webhook Platform dashboard, including endpoint forms, event history, delivery states, and retry actions."
---

# Build the React Dashboard

Build focused, accessible UI changes that fit the existing React and Tailwind patterns. Explain the feature and files before editing, then summarize how to verify it.

## Project Context

- React 19 + TypeScript + Vite; frontend code is in `frontend/src/`.
- `App.tsx` owns session, navigation, API loading, endpoint form, and event state.
- `app/WorkspaceLayout.tsx` supplies the shell, navigation, notices, and loading feedback.
- Feature screens live in `features/auth/`, `features/dashboard/`, `features/endpoints/`, and `features/events/`.
- Shared presentation components and classes are in `shared/ui.tsx`; API calls are in `lib/api.ts`; domain interfaces are in `types.ts`.
- Tailwind CSS is configured through the Vite plugin. Keep the existing utility-class approach.

## Procedure

1. Identify the user-visible flow, its state owner, and the relevant screen/component before editing.
2. Explain the purpose, files, approach, and any React concepts the change uses.
3. Follow the existing component/props pattern; avoid duplicating app-wide API/session logic in leaf components.
4. Represent loading, success, empty, pending, and error states where relevant. Keep UI state aligned with API response shapes in `types.ts`.
5. Use semantic buttons, labels, accessible names, and status text. Do not use color as the only status cue.
6. Verify asynchronous behavior and stale requests; never silently present a failed API call as success.
7. Run `npm run lint` and `npm run build` from `frontend/`. Fix issues introduced by the change, not unrelated baseline issues.

## Delivery UI Notes

- Delivery states are `PENDING`, `SUCCEEDED`, and `FAILED`.
- Test delivery creation and manual retry return `202 Accepted`; a response means queued, not delivered.
- Pending items may update asynchronously. Keep attempt history distinct from the current overall delivery status.
- Only show the manual retry action for failed events; the server remains authoritative and can still reject the action.
- API 401 handling dispatches the `relay:unauthorized` event; preserve the app's session-clearing behavior.
