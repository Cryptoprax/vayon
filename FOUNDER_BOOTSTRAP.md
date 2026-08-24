# Founder Bootstrap

## Architecture

Founder Bootstrap is a server-only extension of the existing Founder authorization layer:

```text
Founder access page / Server Action
  → FounderBootstrapService
  → founderContext() and explicit super_admin check
  → configurable email allowlist
  → FounderBootstrapRepository
  → server-only Supabase Auth Admin API
```

The service-role credential remains inside `lib/supabase/service.ts` and is never serialized, returned by an action, or imported into a client component. The browser supplies only an email and required reason. The service independently reloads the caller and target from trusted Supabase Auth sources.

## Security model

Founder access remains determined exclusively by trusted Supabase Auth application metadata:

```json
{
  "role": "super_admin"
}
```

The bootstrap service:

- requires an authenticated caller whose current `app_metadata.role` is exactly `super_admin`;
- never reads or writes `user_metadata` for authorization;
- rejects target emails outside the configured allowlist;
- rejects email addresses that do not belong to an existing Auth account;
- preserves all unrelated `app_metadata` fields;
- never exposes the service-role credential;
- prevents self-revocation during the caller's active administrative session;
- refuses to revoke pre-existing Super Administrators that were not granted by this bootstrap service;
- records actor ID, target ID, timestamp, reason, and outcome through structured server logging.

Organization and workspace roles cannot invoke Founder Bootstrap. Tenant RLS, organization isolation, workspace isolation, authentication providers, and the existing Founder route guards are unchanged.

## Allowlist configuration

The built-in initial allowlist is:

- `prakyathaiagent@gmail.com`
- `vpprakyath@gmail.com`
- `vsukanya1969@gmail.com`
- `prakyathvp@gmail.com`

Set the server-only `FOUNDER_EMAIL_ALLOWLIST` variable to a comma-separated list to replace the built-in list. Email matching is trimmed, normalized to lowercase, and exact. An explicitly empty value creates an empty allowlist and therefore fails closed.

No production configuration was modified by this sprint.

## Bootstrap flow

1. A previously provisioned `super_admin` signs in normally.
2. The administrator opens `/platform/founder/access`.
3. The server revalidates the caller's Auth session and exact platform role.
4. The page lists only allowlisted emails that already have Auth accounts.
5. The administrator supplies a mandatory audit reason and chooses **Grant Founder**.
6. The service reloads all inputs from trusted server-side sources, rechecks the allowlist, and updates only Auth `app_metadata`.
7. The target receives `app_metadata.role = "super_admin"` while all existing metadata is retained.
8. The target must refresh its session or sign in again so a new JWT contains the updated application metadata.

This design intentionally does not create the first Super Administrator. At least one trusted `super_admin` must already be provisioned through an authorized Supabase operational process. There is no unauthenticated bootstrap endpoint or login-time elevation.

## Role lifecycle

On grant, the service adds a `founder_bootstrap` record to application metadata containing the previous role, actor, timestamp, and active state. Repeated grants are idempotent.

On revoke, only an active bootstrap-managed grant can be changed. The service restores the role that existed immediately before the grant and marks the bootstrap record inactive. Repeated revocations are idempotent. A pre-existing, independently provisioned `super_admin` cannot be stripped through this interface.

Every changed and no-op grant/revoke request emits a structured audit log. Logs contain IDs and the supplied administrative reason, never credentials or raw secrets.

## Operational instructions

1. Confirm the target has completed normal account creation.
2. Confirm its normalized email appears in the active server allowlist.
3. Sign in as an existing `super_admin`.
4. Open `/platform/founder/access` from the Founder Portal.
5. Review current role and bootstrap status.
6. Enter a specific reason of 8–500 characters.
7. Grant or revoke access.
8. Confirm the structured audit event in server logs.
9. Ask the target to refresh its Auth session after a changed role.

Do not place service-role credentials in browser code, manually edit `user_metadata`, or use organization ownership as a substitute for the platform role.
