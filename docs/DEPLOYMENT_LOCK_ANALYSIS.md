# Version 1 deployment lock analysis

## Risk summary

| Stage | Principal lock or resource cost | Risk | Control |
| --- | --- | --- | --- |
| Core schema | Catalog locks; FK dependency checks | Medium | New objects only; 5-second lock timeout |
| Columns | `ACCESS EXCLUSIVE` for `ALTER TABLE`; possible validation scans | High | Separate transaction; maintenance window; additive operations only |
| Indexes | CPU, I/O, temporary space; brief locks at start/end | Medium–High | `CREATE INDEX CONCURRENTLY`; no transaction wrapper; duplicate preflight for unique indexes |
| Functions | Catalog locks | Low | Exact-signature reconciliation; short transaction |
| RLS/policies | Relation metadata locks; authorization change | High | Definition comparison; isolated transaction; immediate tenant/RBAC checks |
| Triggers | Relation metadata locks | Medium | Definition conflict fails closed; identical triggers retained |
| Storage | Row locks on bucket IDs | Low | `ON CONFLICT DO NOTHING`; configuration verification required |

## Exclusive-lock analysis

`002_columns.sql` is the primary availability risk. PostgreSQL uses strong table locks for column and constraint changes. Adding nullable columns is normally brief, while existing-row validation can scan the full table. The site-visit constraints are added `NOT VALID` and validated explicitly so lock acquisition and validation are visible, but validation can still be long-running.

The stage uses `lock_timeout = 5s` and `statement_timeout = 120s`. These values fail quickly rather than waiting indefinitely; they do not guarantee completion. A timeout aborts only that stage because deployment is split.

## Index analysis

The 87 unique index definitions are structurally compared by name and canonical definition. Two duplicate historical definitions are deduplicated during package generation. A conflicting same-name index raises an exception rather than being dropped. Concurrent creation prevents ordinary writes from being blocked for the duration, but requires additional scans and cannot run inside an explicit transaction. Unique indexes receive a duplicate-data preflight before creation.

## Deadlock and ordering controls

- Execute stages serially with one operator session.
- Do not run application migrations concurrently.
- Pause high-volume import, workflow, and bulk CRM jobs.
- Monitor `pg_stat_activity`, blocking PIDs, replication lag, CPU, I/O, and temporary storage.
- Cancel at the current stage if lock acquisition fails; never reorder stages ad hoc.

## Estimated risk

Overall database-change risk: **High until clone execution and timing evidence exist; Medium after successful clone rehearsal with production-scale data**.
