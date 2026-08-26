# Sprint 144 — API Authentication Boundary

## Root cause

The root Next.js proxy excluded only `/api/webhooks/**` from its matcher and
pass-through guard. Every other API request was sent to `refreshSession`, where
the page-level authentication and organization-membership checks could redirect
the request to `/login` or `/onboarding` before an API route handler ran.

## Resolution

The root proxy now excludes `/api` and every `/api/**` request from its matcher.
It also has an explicit API pass-through guard so direct proxy invocation cannot
apply page redirects to an API request. Authentication and authorization for API
requests remain the responsibility of their existing route handlers.

Public marketing routes still pass through the existing public-route
classification. Application routes still pass through the unchanged Supabase
session, login, organization-membership, and onboarding checks.

## Security and scope

- No Paddle checkout, portal, webhook, or billing service code changed.
- No authentication, session refresh, RBAC, entitlement, or permission logic
  changed.
- No database schema, migration, subscription, or pricing code changed.
- API handlers remain responsible for returning their existing `401`, `400`,
  `405`, or successful responses.

## Regression coverage

`tests/sprint144-api-auth-boundary.test.mjs` verifies that all API paths bypass
the proxy, Paddle route handlers remain present, public pages remain inside the
public website boundary, and protected application paths remain inside the
authentication boundary.

## Validation

- TypeScript: passed.
- ESLint: passed with zero errors (one unrelated pre-existing warning).
- Tests: 1,251 passed, zero failed.
- Next.js production build: passed.
- Anonymous production smoke test: Paddle checkout returned `405` for `GET` and
  `400` for an invalid `POST`; Paddle webhook returned `400` for a missing
  signature. None redirected.
- Public `/pricing`: `200 OK`.
- Protected `/vayon/dashboard`: `307` to `/login`, as expected.
