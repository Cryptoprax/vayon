# Version 1 deployment execution order

Status: **manual review required; no production execution authorized**.

## Preconditions

1. Confirm project ref `aanonopiylqpfvpoqvdc` through a second channel.
2. Freeze the reviewed artifact hashes and production catalog snapshot.
3. Take a database and storage backup; restore both into an isolated production clone.
4. Run `PRE_DEPLOY_VALIDATION.sql` on the clone and retain its output.
5. Resolve every reported structural conflict. Do not initialize migration history and do not run `supabase db push`.
6. Assign an operator, reviewer, rollback owner, and incident channel.

## Deployment order

| Order | Stage | Transaction | Gate |
| ---: | --- | --- | --- |
| 0 | `PRE_DEPLOY_VALIDATION.sql` | Read-only, rolled back | Catalog matches reviewed baseline |
| 1 | `001_core_schema.sql` | Independent transaction | New relations and extensions only |
| 2 | `002_columns.sql` | Independent transaction | Additive columns; constraint conflicts fail closed |
| 3 | `003_indexes.sql` | No enclosing transaction | Duplicate preflights pass; concurrent indexes complete |
| 4 | `004_functions.sql` | Independent transaction | Exact RPC signatures and grants reconcile |
| 5 | `005_rls.sql` | Independent transaction | RLS, policies, and triggers reconcile |
| 6 | `006_storage.sql` | Independent transaction | Private bucket configuration verified |
| 7 | `007_seed.sql` | Independent transaction | Intentionally performs no seed writes |
| 8 | `008_validation.sql` | Read-only transaction | Counts and required surfaces are reviewed |
| 9 | `POST_DEPLOY_VALIDATION.sql` | Read-only, rolled back | Full schema/RLS/RPC/index/trigger/bucket verification |

Never paste all stages into one transaction. Stop after any failed gate. Do not continue because a later stage may depend on an object that failed earlier.

## Verification checklist

- [ ] Backup and clone restore verified.
- [ ] Pre-deploy output archived and reviewed by two people.
- [ ] No parser errors or `psql` meta-commands.
- [ ] No `DROP TABLE`, `TRUNCATE`, migration-history writes, or data seeds.
- [ ] Unique-index duplicate preflights return no rows.
- [ ] Function signatures, return types, language, volatility, security, search path, and body hashes match.
- [ ] Policy roles, command, permissiveness, `USING`, and `WITH CHECK` match.
- [ ] Trigger definitions and enabled states match.
- [ ] Storage buckets remain private with approved limits and MIME types.
- [ ] TypeScript, ESLint, tests, build, and package audit pass.
- [ ] Post-deploy validation and application smoke tests pass.

## Emergency stop points

Stop before each numbered stage when lock waits, replication lag, elevated error rates, unexpected catalog drift, or an unreviewed conflict appears. Leave migration history unchanged.
