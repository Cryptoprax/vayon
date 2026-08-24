# Founder Bootstrap Environment Diagnosis

## Root cause

`scripts/bootstrap-founders.ts` runs as a standalone Node/TypeScript utility, outside the Next.js application runtime. It previously read `process.env` directly and did not invoke a dotenv loader. Node does not load `.env.local` automatically, so the script reached its configuration validation before the repository environment file had been read.

Presence-only diagnostics immediately before the original validation produced:

| Variable | Before loading | After Next.js loading |
| --- | --- | --- |
| `SUPABASE_URL` | Missing | Missing |
| `NEXT_PUBLIC_SUPABASE_URL` | Missing | Present (value redacted) |
| `SUPABASE_SERVICE_ROLE_KEY` | Missing | Present (value redacted) |

No variable value or secret was printed or recorded.

## Loader and loading order

The repository had no dotenv loader in the Founder provisioning utility. The repair uses Next.js's standard external-process loader, `loadEnvConfig` from `@next/env` version 16.3.0, which is installed with Next.js 16.3.0.

The runtime order is now:

1. Import `loadEnvConfig` from `@next/env`.
2. Call `loadEnvConfig(process.cwd())` before reading configuration.
3. Next.js loads the applicable environment files; in the local diagnosis it loaded `.env.local`.
4. Resolve the URL from `SUPABASE_URL`, falling back to `NEXT_PUBLIC_SUPABASE_URL`.
5. Read `SUPABASE_SERVICE_ROLE_KEY` unchanged.
6. Run the existing missing-configuration validation.
7. Continue with the unchanged provisioning behavior.

Existing process-level environment variables retain precedence under the Next.js loader. The URL fallback order inside the script also remains `SUPABASE_URL` followed by `NEXT_PUBLIC_SUPABASE_URL`.

## Exact repair

The script now calls:

```ts
loadEnvConfig(process.cwd());
```

before any environment variable is read. No credentials were hardcoded, no values are logged, and no authentication, RBAC, Founder Bootstrap, provisioning, or metadata behavior changed.

## Validation evidence

After applying the same loader from the repository root:

- `.env.local`: detected and loaded
- `NEXT_PUBLIC_SUPABASE_URL`: detected
- `SUPABASE_SERVICE_ROLE_KEY`: detected
- secret values exposed: none

The existing metadata merge, `app_metadata.role = "super_admin"` update, idempotency check, missing-user handling, and failure exit behavior remain unchanged.
