# Sprint 96 Additive Constraint Deployment

## Result

All eight additive CHECK constraints in `002_columns.sql` now use identity-only reconciliation.

| Constraint | Table | Column |
| --- | --- | --- |
| `notification_preferences_digest_frequency_check` | `notification_preferences` | `digest_frequency` |
| `creative_assets_mime_type_check` | `creative_assets` | `mime_type` |
| `knowledge_articles_knowledge_kind_check` | `knowledge_articles` | `knowledge_kind` |
| `knowledge_articles_visibility_check` | `knowledge_articles` | `visibility` |
| `site_visits_status_check` | `site_visits` | `status` |
| `site_visits_type_check` | `site_visits` | `visit_type` |
| `site_visits_priority_check` | `site_visits` | `priority` |
| `site_visits_duration_check` | `site_visits` | `duration_minutes` |

## Existing constraint behavior

An existing constraint is accepted and skipped when its expected name is attached to the expected table, its catalog type is CHECK (`contype = 'c'`), and `conkey` identifies exactly the expected, non-dropped column.

No SQL definition is read or compared. The guards do not call `pg_get_constraintdef()` and do not inspect `IN`, `ANY`, whitespace, casts, parentheses, allowed values, or range syntax for an existing constraint.

If the named constraint exists on the expected table but is not a CHECK constraint or does not target exactly the expected column, deployment fails closed with an identity conflict.

## Missing constraint behavior

When a constraint is missing, the stage:

1. validates existing rows against the intended expression;
2. raises an exception if any row violates it;
3. adds the named constraint as `NOT VALID`;
4. validates the constraint before commit.

The four formerly inline column checks were separated from `ADD COLUMN IF NOT EXISTS`. This ensures an existing column with a missing constraint receives the same guarded reconciliation instead of silently skipping constraint creation.

## Safety

The stage retains one transaction, local lock and statement timeouts, existing-data validation, idempotent reruns, and rollback on failure. It contains no `DROP CONSTRAINT`, `DROP TABLE`, `DELETE`, `UPDATE`, or `TRUNCATE` statement.

No SQL was executed, no deployment occurred, and production was not modified.
