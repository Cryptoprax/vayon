# Sprint 95 Constraint Semantic Idempotency Report

## Scope

Every constraint reconciliation block in `supabase/reconciliation/002_columns.sql` was reviewed. Four blocks previously compared a normalized literal string from `pg_get_constraintdef()` with handwritten SQL. All four comparisons were replaced.

## Modified comparisons

| Constraint | Previous comparison | Semantic comparison | Equivalent forms accepted |
| --- | --- | --- | --- |
| `site_visits_status_check` | Literal rendered definition | Extracted, distinct, sorted allowed-value set plus verified `status` membership predicate | `status IN (...)`, `status = ANY(ARRAY[...])` |
| `site_visits_type_check` | Literal rendered definition | Extracted, distinct, sorted allowed-value set plus verified `visit_type` membership predicate | `visit_type IN (...)`, `visit_type = ANY(ARRAY[...])` |
| `site_visits_priority_check` | Literal rendered definition | Extracted, distinct, sorted allowed-value set plus verified `priority` membership predicate | `priority IN (...)`, `priority = ANY(ARRAY[...])` |
| `site_visits_duration_check` | Literal rendered definition | Normalized integer-range semantics with exact lower and upper bounds | `BETWEEN 15 AND 1440`, equivalent inclusive `>= 15 AND <= 1440` orderings |

## Fail-closed behavior

The finite-value guards fail when any allowed value is added, removed, renamed, or case-changed. They also reject a different target column, unsupported predicate shape, negation, or compound `AND`/`OR` logic. Duplicate or reordered values do not create false conflicts because they do not change the allowed set.

The duration guard fails when either inclusive bound, the target column, or the range logic differs. It accepts PostgreSQL's normalized inclusive-comparison rendering of `BETWEEN`.

## Preserved deployment guarantees

- The stage remains wrapped in one transaction.
- `lock_timeout = '5s'` and `statement_timeout = '120s'` remain local to that transaction.
- Missing constraints still perform an existing-data precheck, add the constraint as `NOT VALID`, and validate it before commit.
- Existing equivalent constraints are left untouched.
- Conflicting constraints raise an exception and roll back the stage.
- No `DROP CONSTRAINT`, `DROP TABLE`, `DELETE`, `UPDATE`, `TRUNCATE`, or other destructive reconciliation was introduced.
- The generator emits the same semantic guards on future package regeneration.

## Execution statement

This review and change performed no database connection, SQL execution, deployment, or production modification.
