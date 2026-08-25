# Sprint 142 — Public Website Authentication Boundary

## Outcome

The shared request proxy now distinguishes public website routes from authenticated application routes. Anonymous visitors can request marketing, documentation, help, company, demo, ROI, media, partner, investor, status, and legal pages without being redirected to login.

Public content families with nested pages are explicitly prefix-matched: Features, Solutions, Industries, Customers, Blog, and Documentation. `/platform` is an exact public destination so its administrative child routes are not implicitly exposed.

## Authentication Boundary

Authentication remains required for application route families such as `/vayon/**`, `/founder/**`, `/crm/**`, `/creative/**`, `/billing/**`, `/settings/**`, and `/admin/**`. Anonymous requests outside the public inventory continue through the existing redirect to `/login` with the requested path retained in the `next` parameter.

The existing Supabase session refresh, authenticated login/signup redirect, organization-membership check, onboarding flow, RBAC, and permission systems were not changed. Public requests now return after session refresh and before application-only membership enforcement.

## Footer and SEO

Every internal footer destination is represented by a public exact route or a public nested-content family. Public pages therefore remain directly crawlable and do not depend on an authenticated session.

## Validation

Automated regression coverage verifies the complete Sprint 142 public inventory, nested public content, absence of application roots from the public allowlist, and preservation of the anonymous application redirect.

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For deployed runtime verification, request every public URL without cookies and confirm HTTP 200, then request protected application URLs without cookies and confirm redirect to `/login`. Incognito-browser validation requires a running or deployed environment and should repeat the same inventory.
