# Founder Bootstrap Environment Fix

## Scope

Only the one-time server provisioning utility's Supabase URL resolution changed. Authentication, RBAC, the Founder Bootstrap service, migrations, reconciliation, and production configuration were not modified.

## Resolution order

`scripts/bootstrap-founders.ts` now resolves the project URL in this order:

1. `SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_URL`

`SUPABASE_SERVICE_ROLE_KEY` remains required and is read exactly as before. No environment-variable values or secrets are logged.

## Preserved behavior

- The same four Founder email addresses are considered.
- Existing users are located through the existing Supabase Admin client.
- Existing `app_metadata` fields are spread into the update before `role: "super_admin"` is applied.
- Users already assigned `super_admin` are skipped, preserving idempotency.
- Missing users remain non-fatal skips.
- Failed updates still produce a non-zero exit code.
- The script remains server-only and runs only when explicitly invoked.

## Validation

Static validation confirms that configuration is accepted from either supported URL variable while the service-role key remains mandatory. Existing metadata preservation, the `app_metadata.role` update, and the existing idempotency guard are unchanged.
