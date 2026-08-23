# Version 1 production deployment runbook

This runbook applies the additive VAYON Version 1 schema synchronization package to production project `aanonopiylqpfvpoqvdc`. It does not replay historical migrations, create or repair migration history, run `supabase db push`, or recreate populated tables.

## Deployment order

1. Approve a maintenance window and name an operator, reviewer, and rollback owner.
2. Rotate any temporary database credential used during the earlier audit.
3. Create a fresh database backup and storage inventory. Restore the backup into an isolated clone and record successful restore verification.
4. Re-run the read-only production catalog audit. Stop if the project ref, object counts, or migration classifications differ from the reviewed report.
5. Generate the artifacts with `npm run generate:schema:v1`, then run `npm run audit:schema:v1`. Review the generated diff; never edit production directly from a historical migration.
6. Run the patch against the restored clone with `ON_ERROR_STOP` enabled. The patch uses one transaction, short lock/statement timeouts, catalog guards, and data compatibility checks.
7. Run `VERSION1_POST_DEPLOY_CHECK.sql` on the clone. Then run application type checking, lint, tests, build, security audit, production audit, migration audit, and smoke tests.
8. Obtain two-person approval. Apply only `VERSION1_PRODUCTION_PATCH.sql` to production using the Supabase SQL editor or an approved `psql` session. Do not run `supabase db push`.
9. Immediately run `VERSION1_POST_DEPLOY_CHECK.sql`, provider health checks, and critical user-journey smoke tests. Monitor errors and latency.
10. Leave migration history absent. History creation or repair is outside this deployment and requires separately proven semantic equivalence.

## Rollback plan

The package is additive. On any SQL error its transaction rolls back automatically. If verification fails after commit, stop application writes and assess whether the new objects can safely remain disabled. Do not issue improvised reverse DDL or delete data. Restore the verified backup when existing data or definitions are affected, then verify database and storage integrity before reopening traffic.

## Verification checklist

- [ ] Correct production project ref independently confirmed.
- [ ] Backup completed and clone restore verified.
- [ ] Patch reviewed with no `DROP TABLE`, top-level `DELETE`, or `TRUNCATE`.
- [ ] Existing represented migrations excluded.
- [ ] No migration history initialization or repair.
- [ ] No historical seed/data rewrite approved implicitly.
- [ ] Constraint compatibility preflight passed.
- [ ] Required tables, columns, indexes, policies, functions/RPCs, triggers, views, and storage verified.
- [ ] RLS enabled on every Version 1 tenant table.
- [ ] Tenant isolation and RBAC smoke tests passed.
- [ ] TypeScript, ESLint, regression tests, production build, theme, security, production, and migration audits passed.
- [ ] Monitoring shows no elevated error rate or latency.

## Fail-closed conditions

Stop without applying when the catalog is stale, a backup restore is unverified, incompatible constraint data exists, a required dependency object is absent, a guard detects conflicting semantics, or post-deploy checks report any missing object. Escalate conflicts for a separately reviewed repair; never replay the historical migration chain.
