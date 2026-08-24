# Initial Founder Provisioning

## Purpose

`scripts/bootstrap-founders.ts` is a one-time, explicitly invoked server-side utility. It assigns the trusted Supabase Auth application role `super_admin` to the four approved Founder accounts only when those accounts already exist.

The utility does not create users, alter authentication flows, change RBAC, execute SQL, modify policies, or run automatically during installation, builds, deployment, login, or application startup.

## Safety behavior

- Reads only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the process environment.
- Uses the Supabase Auth Admin API from server-side Node.js code.
- Never prints either environment value.
- Looks up exact normalized email addresses from the fixed Founder list.
- Preserves the complete existing `app_metadata` object, including provider metadata.
- Merges only `role: "super_admin"`.
- Skips missing accounts without failing.
- Skips accounts already carrying the correct role, making repeated runs mutation-free.
- Continues processing other approved accounts after an individual update failure.
- Exits non-zero if Auth user enumeration or any role update fails.

## Usage

Run from a trusted administrative workstation with Node.js 22 or newer. Supply credentials through the process environment or an approved secret manager; never place them in the command, repository, shell history, or documentation.

PowerShell example using environment variables already present in the process:

```powershell
node --experimental-strip-types scripts/bootstrap-founders.ts
```

The script must be invoked manually. It is intentionally absent from `package.json` lifecycle and deployment scripts.

## Expected output

Each allowlisted address produces one or more sanitized status lines:

```text
FOUND approved@example.com
UPDATED approved@example.com
SKIPPED missing@example.com — authenticated user does not exist
SKIPPED configured@example.com — role already configured
FAILED approved@example.com — role update was rejected
```

The final summary always contains:

```text
Founder provisioning summary
FOUND 3
UPDATED 2
SKIPPED 2
FAILED 0
```

`FOUND` counts existing Auth accounts. `UPDATED` counts actual metadata changes. `SKIPPED` includes missing accounts and accounts already configured. `FAILED` counts operational failures.

After a successful update, affected users must refresh their Supabase session or sign in again so their JWT contains the new `app_metadata.role` value.

## Idempotency verification

After a successful first run, execute the same command a second time. Existing Founder accounts should report `SKIPPED — role already configured`, `UPDATED 0`, and `FAILED 0`. Their other `app_metadata` fields remain unchanged.

## Recovery

If the script reports `FAILED`:

1. Stop and retain the sanitized console output.
2. Confirm the server-side environment contains the correct project URL and service-role credential without printing either value.
3. Confirm the credential belongs to the intended Supabase project and still has Auth Admin permission.
4. Resolve connectivity or permission errors.
5. Run the utility again. Successfully updated accounts are skipped, so recovery does not repeat changes.

If an unintended approved account was provisioned, use the authenticated Founder Bootstrap interface at `/platform/founder/access` only when the account is bootstrap-managed. Otherwise, have an authorized Supabase administrator restore the account's prior `app_metadata.role` while preserving all other metadata. Do not edit `user_metadata`.

## Deletion after provisioning

After all intended accounts are verified and have refreshed their sessions:

1. Retain the operational output in the approved secure audit location.
2. Remove `scripts/bootstrap-founders.ts` in a reviewed follow-up change.
3. Remove this runbook if organizational policy does not require retaining it.
4. Do not delete or rotate unrelated Supabase configuration as part of utility removal.

Deleting the script does not revoke provisioned roles. Role lifecycle management continues through the secured Founder Bootstrap capability.
