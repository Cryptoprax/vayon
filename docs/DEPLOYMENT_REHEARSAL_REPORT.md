# VAYON Version 1 deployment rehearsal report

> Historical Sprint 92 result. Sprint 93 repaired the `inventory_projects` schema dependency; see `SCHEMA_DEPENDENCY_REPAIR.md`. Other rehearsal findings remain open.

Date: 2026-08-24  
Method: static/virtual rehearsal against the frozen read-only catalog captured `2026-08-23T18:39:26.791Z`  
Production SQL executed: **No**  
Historical migrations replayed: **No**

## Executive result

**Rehearsal failed closed. The staged package is not executable as ordered.** Stage `001_core_schema.sql` contains five foreign keys to `public.inventory_projects`, an object absent from the frozen production catalog and every deployment stage.

## Package integrity

| Surface | Rehearsed inventory | Result |
| --- | ---: | --- |
| Stages | 8 | Structurally present |
| Tables | 92 | Blocked by missing FK dependency |
| Additive columns | 69 | Ordering valid after stage 001 |
| Primary keys in new definitions | 92 | Static definition present |
| Foreign-key references | 277 | Five unresolved references |
| Unique constraints | 29 | Data compatibility not proven |
| Check constraints | 153 plus 4 additive | Data compatibility not proven |
| Generated columns | 4 | Expression/runtime compatibility not proven |
| Indexes | 87 | No duplicate names; runtime validity not checked |
| Functions | 102 | Exact-signature guards present |
| Policies | 173 | No duplicate identities; comparator is not canonically stable |
| Triggers | 7 | No duplicates; enabled-state comparison absent |
| Buckets | 2 | IDs repeat-safe; existing configuration equivalence not enforced |

## Phase results

### Execution order — FAIL

`001_core_schema.sql` fails when it reaches the Creative Studio tables because `public.inventory_projects` does not exist. Later stages cannot repair a failed first stage.

### Static execution — FAIL

Blocking references:

- `creative_campaigns.project_id → public.inventory_projects(id)`
- `creative_assets.project_id → public.inventory_projects(id)`
- `creative_timeline.project_id → public.inventory_projects(id)`
- `creative_generation_jobs.project_id → public.inventory_projects(id)`
- `creative_campaign_packs.project_id → public.inventory_projects(id)`

### Idempotency — FAIL

Positive findings:

- No duplicate index, policy, trigger, or bucket identities.
- Tables and columns use existence guards.
- Buckets use `ON CONFLICT(id) DO NOTHING`.
- Indexes use structural checks and `CONCURRENTLY IF NOT EXISTS`.

Blocking findings:

- `CREATE TABLE IF NOT EXISTS` does not compare existing column, PK, FK, CHECK, default, generated-expression, or nullability definitions.
- Policy comparison uses source text against `pg_policies.qual/with_check`. PostgreSQL canonical output adds parentheses and may remove `public.` qualification, so an identical policy can be classified as different and dropped/recreated on every run.
- Trigger comparison does not compare `tgenabled`; a disabled or replica-only trigger can be accepted as identical.
- Index comparison does not inspect `pg_index.indisvalid` or `indisready`; an invalid concurrent index can be retained by `IF NOT EXISTS`.
- Existing bucket ID conflicts are ignored instead of comparing visibility, size, and MIME configuration.

### Rollback — PARTIAL PASS

Stages `001`, `002`, `004`, `005`, `006`, and `007` are independently transactional. Stage `003` is intentionally non-transactional for concurrent index creation. The rollback runbook correctly prohibits improvised destructive reversal.

Limitations:

- A failed concurrent index may remain invalid and requires separately approved cleanup.
- Earlier successful stages remain committed after a later-stage failure.
- There is no automatic down migration.
- Backup restoration would also revert legitimate writes after the restore point.

### Constraint verification — REVIEW REQUIRED

New-table definitions contain 92 PKs, 277 FK references, 29 unique constraints, 153 CHECK constraints, and 4 generated columns. Four additive site-visit constraints use compatibility checks and `NOT VALID` followed by validation.

Existing same-name tables are not structurally reconciled. A partial production table can bypass all inline constraints because `CREATE TABLE IF NOT EXISTS` skips the definition.

### Function verification — REVIEW REQUIRED

The 102 function guards compare exact signature, return type, language, volatility, security-definer status, search path, and body hash. Trigger-function dependencies are present.

Runtime SQL dependencies are not fully parser-resolved by static analysis, and the Creative functions depend on tables blocked in stage 001. PostgreSQL clone parsing is still required.

### Policy verification — FAIL

Roles, command, permissiveness, `USING`, and `WITH CHECK` are compared, but expression comparison is not canonical. Frozen catalog evidence shows PostgreSQL policy expressions contain canonical parentheses and unqualified public functions, while expected strings frequently omit parentheses and retain `public.`. Identical-policy non-recreation is therefore unproven.

### Trigger verification — FAIL

Timing, events, table, and function are embedded in `pg_get_triggerdef` comparison. Arguments and `WHEN` clauses would also appear there. Enabled state is not compared despite being required.

### Index verification — REVIEW REQUIRED

There are 87 unique index identities. Definitions include uniqueness, predicate, INCLUDE, operator class, and sort order via `indexdef`; default `btree` text is normalized. Unique indexes have duplicate-data preflights. Runtime validity/readiness flags are missing.

### Storage verification — REVIEW REQUIRED

- `knowledge-documents`: private, 20 MiB, PDF/DOCX/Markdown/TXT.
- `product-feedback`: private, 5 MiB, PNG/JPEG/WebP.

Bucket IDs are idempotent. Existing conflicting configuration is not corrected or rejected. Storage policy canonical equivalence shares the RLS comparator defect.

## Stage risk classification

| Stage | Risk | Reason |
| --- | --- | --- |
| 001 core schema | **CRITICAL** | Missing `inventory_projects` dependency makes execution fail |
| 002 columns/constraints | **HIGH** | Strong table locks, data scans, partial-table drift not reconciled |
| 003 indexes | **HIGH** | Non-transactional; invalid-index recovery and production timing unproven |
| 004 functions | **MEDIUM** | Catalog replacement is transactional; runtime dependencies require clone parsing |
| 005 RLS/triggers | **CRITICAL** | Policy canonicalization and trigger enabled-state defects |
| 006 storage | **HIGH** | Existing bucket configuration drift is silently retained |
| 007 seed | **LOW** | No seed mutations |
| 008 validation | **MEDIUM** | Read-only but primarily reports counts; does not prove every expected definition |

## Module prediction

Because stage 001 fails transactionally, **none of the missing Version 1 database modules become operational from this package**. Existing production modules remain at their pre-deployment state.

After all blockers are corrected and clone rehearsal passes, expected database-backed surfaces include Organizations, Workspaces, Marketing/Creative/Growth Studio, Knowledge, Product Intelligence, Continuous Learning, Billing, Notifications, Settings, and supporting AI Workforce observability. Public Website behavior is largely application-level. CRM and AI Employees still depend on their existing repositories/providers and must not be inferred operational solely from schema presence.

## Rehearsal conclusion

Deployment package integrity: **FAIL**  
Dependency integrity: **FAIL**  
Rollback readiness: **PARTIAL**  
Idempotency: **FAIL**  
Recommendation: **NO-GO**
