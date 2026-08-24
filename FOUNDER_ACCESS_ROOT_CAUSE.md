# Founder Access Root Cause

## Scope

This review was limited to the application authorization layer. Authentication providers, database policies, migrations, reconciliation and deployment files, billing, integrations, and production configuration were not changed.

## Exact root cause

Founder pages authorize through `founderContext()` in `features/platform/founder/services/founder-context.ts`. The previous predicate admitted either:

- the legacy application role `founder`; or
- the canonical platform role `super_admin` **and** a Boolean `app_metadata.founder` claim.

The second condition was impossible under the repository's identity model. The platform role catalog seeds `super_admin`, and platform-level RLS/RPC authorization consistently recognizes `app_metadata.role = 'super_admin'`. No role seed, onboarding path, callback, profile service, or authentication flow writes `app_metadata.founder`. Consequently, a canonical `super_admin` session evaluated as follows:

```text
role === "founder"                         false
role === "super_admin"                    true
app_metadata.founder === true              false
false || (true && false)                   false
```

That caused `FounderAccessError`. Each Founder page intentionally catches that error and invokes `notFound()`, producing the observed 404.

The repository evidence also establishes that organization ownership cannot be substituted for platform authorization: `organization_owner` is assigned to every customer organization creator and is tenant-scoped. Treating that role as Founder would create a platform-wide privilege escalation.

## Authorization flow

### Before

1. Supabase SSR loads the authenticated user with `auth.getUser()`.
2. `founderContext()` reads `user.app_metadata.role`.
3. It checks the legacy `founder` role, or `super_admin` combined with the unsupported Boolean Founder claim.
4. Organization and workspace ownership are not consulted because these dashboards are platform-level.
5. Email is not consulted; no identity is authorized by a mutable or hardcoded email.
6. Feature flags are not consulted; they do not grant security roles.
7. Failure raises `FounderAccessError`; all twelve Founder route pages catch it and call `notFound()`.
8. `app/platform/layout.tsx` separately repeated the same predicate to hide the Founder navigation entry.

### After

1. Supabase SSR still loads and verifies the current user in exactly the same way.
2. One shared `isFounder()` predicate reads only trusted `app_metadata.role`.
3. It accepts the legacy `founder` role or the canonical platform-wide `super_admin` role.
4. Missing users, missing roles, customer organization roles, workspace roles, and all other platform roles remain denied.
5. `founderContext()` remains the server-side enforcement point and continues to throw `FounderAccessError` on denial.
6. Every Founder route retains its fail-closed `notFound()` behavior.
7. The platform layout reuses the same predicate solely to control navigation visibility.

## Files changed

- `features/platform/founder/services/founder-context.ts`
- `app/platform/layout.tsx`
- `tests/sprint116-founder-rbac-resolution.test.mjs`
- `FOUNDER_ACCESS_ROOT_CAUSE.md`

## Why the fix is secure

- Authorization still depends on server-verified Supabase Auth `app_metadata`, not user-editable metadata.
- The repair recognizes the repository's existing highest-privilege platform role; it does not grant a new privilege to a tenant role.
- Organization owners and administrators remain denied.
- There is no email allowlist, hardcoded identity, development bypass, feature-flag bypass, or unconditional success path.
- Tenant, organization, and workspace RLS remain unchanged.
- The server guard remains authoritative; hiding the navigation item is not treated as authorization.

## Founder routes audited

The following routes all resolve through services that call `founderContext()` and retain `FounderAccessError` to `notFound()` handling:

- `/platform/founder`
- `/platform/founder/ai`
- `/platform/founder/command-center`
- `/platform/founder/marketing`
- `/platform/founder/sales`
- `/platform/founder/customer-success`
- `/platform/founder/intelligence`
- `/platform/founder/memory`
- `/platform/founder/operations`
- `/platform/founder/workflows`
- `/platform/founder/integrations`
- `/platform/founder/tenants`

## Validation evidence

- Focused Founder RBAC regression: PASS (4/4).
- TypeScript: PASS.
- ESLint: PASS (zero errors; one unrelated pre-existing warning in `scripts/generate-rc1-release-reports.mjs`).
- Full regression suite: PASS (1,119/1,119).
- Production build: PASS (334 generated pages, including all twelve Founder routes).
- Tenant and organization isolation: structurally preserved; no repository, query, RLS, or policy was changed.
- Security audit: the regression asserts that organization/workspace membership cannot satisfy Founder authorization.

## Operational identity invariant

An account must carry the trusted `app_metadata.role` value `super_admin` (or the retained legacy `founder` value) to enter the Founder Portal. An account with a missing or customer-scoped role remains correctly denied. Assigning or changing production identity metadata is outside this sprint and was not performed.
