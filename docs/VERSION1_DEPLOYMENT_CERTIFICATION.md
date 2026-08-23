# VAYON Version 1 deployment certification

Date: 2026-08-24  
Scope: local release package only  
Production SQL executed: **No**  
Deployment performed: **No**

## Readiness score

**82/100 — conditional NO-GO pending clone rehearsal and production definition evidence.**

| Area | Score | Finding |
| --- | ---: | --- |
| Parser compatibility | 10/10 | Accidental prose and `psql` meta-commands removed |
| Staging and recovery | 9/10 | Eight independent stages, validation gates, rollback runbook |
| Tables and columns | 8/10 | Additive only; production-scale lock timing still unverified |
| Functions/RPCs | 9/10 | Exact signature, result, language, volatility, security, search path, and body hash reconciliation |
| Policies/RLS | 8/10 | Definition-aware; live replacement requires clone tenant-isolation proof |
| Triggers | 8/10 | Definition comparison; conflicts fail closed |
| Indexes | 8/10 | Structural checks and concurrent creation; production runtime unmeasured |
| Storage | 7/10 | Private bucket inserts guarded; existing configuration drift must be reviewed |
| Validation | 8/10 | Read-only pre/post catalog reports; not executed against a clone in this sprint |
| Operational evidence | 7/10 | Application validation required; database execution intentionally prohibited |

## Statement classification

### Safe

- New `CREATE TABLE IF NOT EXISTS` definitions after catalog preflight.
- Additive `ADD COLUMN IF NOT EXISTS` when the existing definition is absent and dependencies exist.
- Identical functions, policies, indexes, and triggers retained without recreation.
- Private bucket inserts using `ON CONFLICT(id) DO NOTHING`.
- Read-only validation transactions ending in `ROLLBACK`.

### Review required

- All `ALTER TABLE` operations because of relation locks.
- Non-null/defaulted columns on populated tables.
- Concurrent index build time and temporary-space consumption.
- Unique-index duplicate preflights.
- RLS policy replacement when a material definition difference is proven.
- Runtime DELETE operations inside `replace_mfa_recovery_codes` and `manage_organization_team`; these are preserved business operations and do not execute during deployment.
- Function replacement when the exact signature exists but metadata or body hash differs.

### Production blockers

- Any preflight/catalog drift not represented in the reviewed package.
- Any same-name index or trigger with a conflicting definition.
- Existing data violating a proposed constraint or unique index.
- Missing dependency tables, extensions, helper functions, or roles.
- Failed backup/restore rehearsal.
- Any RLS or RPC tenant-isolation regression.

## Reconciliation improvements

- Functions now resolve exact signatures with `to_regprocedure` and compare return type, language, volatility, security-definer state, search path, and SHA-256 body hash.
- Policies compare command, roles, permissive/restrictive behavior, `USING`, and `WITH CHECK`; recreation occurs only after a detected difference.
- Triggers compare canonical trigger definitions; conflicts fail closed instead of being blindly recreated.
- Indexes compare 87 unique canonical structures, deduplicate two repeated historical definitions, and use concurrent creation. Unique indexes include duplicate-data preflight checks.
- Constraints are never dropped by the staged package. Missing constraints use compatibility checks and explicit validation; conflicting constraints stop deployment.
- Storage creation remains tenant-safe and private; validation exposes configuration for manual equivalence review.

## Remaining blockers

1. The staged SQL has not been parsed or rehearsed by PostgreSQL because SQL execution is forbidden by Sprint 91.
2. Production catalog definitions must be freshly captured and compared with the generated expectations.
3. Backup and storage restore must be demonstrated on an isolated clone.
4. Lock duration, concurrent index duration, temporary-space usage, and replication impact require production-scale rehearsal.
5. RLS, RPC, storage-path, and cross-tenant security tests must pass against the clone.
6. Production environment configuration remains incomplete in this local validation context; missing variable names are reported by `audit:v1` without exposing values.

## Local validation evidence

- TypeScript: PASS
- ESLint: PASS with one pre-existing warning in the untracked RC1 report generator
- Regression tests: PASS — 1,008/1,008
- Production build: PASS — 334 generated routes/pages
- Static schema/function/policy/trigger/index/storage/idempotency package audit: PASS
- Version 1 repository audit: PASS
- Production readiness audit: PASS
- Read-only production catalog refresh: PASS; 29 missing, 2 partial, and 1 conflicting migration units remain until deployment
- Provider observation during build: OpenAI returned sanitized `billing_required` / `credit_balance_exhausted`; this is an operational launch blocker, not a SQL parser failure

## Recommendation

**NO-GO for production execution today.** The package is suitable for enterprise manual review and clone rehearsal. Production approval requires all blockers above to be closed with retained evidence and two-person sign-off.
