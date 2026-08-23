# Version 1 lock simulation report

Method: static PostgreSQL lock-model analysis. No SQL was executed.

## Estimated deployment duration

| Stage | Estimated duration after blockers are fixed | Maximum material lock exposure |
| --- | ---: | ---: |
| Preflight | 10–60 seconds | Read locks only |
| 001 core schema | 1–5 minutes | Catalog/FK locks; transaction duration |
| 002 columns/constraints | 2–15 minutes | `ACCESS EXCLUSIVE` acquisition within 5 seconds; retained until stage commit |
| 003 indexes | 5–45 minutes | Brief strong locks at concurrent-build start/end; long CPU/I/O activity |
| 004 functions | 10–60 seconds | Catalog locks until commit |
| 005 RLS/triggers | 1–5 minutes | Relation metadata locks until commit |
| 006 storage | Under 10 seconds | Bucket-row locks |
| Validation | 10–120 seconds | Read locks only |

Estimated total after correction: **10–75 minutes**. This is a planning estimate, not evidence.

## Maximum expected lock duration

- Lock acquisition wait is bounded by `lock_timeout = 5s` in transactional stages.
- An acquired lock is not released after five seconds; it is held until the stage commits or rolls back.
- Individual statements are bounded by `statement_timeout = 120s`.
- Stage `002` can retain locks acquired by early ALTER statements across all 69 column additions and four constraint validations. Practical maximum retention is therefore the entire stage, potentially **2–15 minutes**, not 120 seconds.

## Largest operations

1. Concurrent indexes over workflow, analytics, knowledge, marketing, notification, property, and intelligence event tables.
2. Validation scans for site-visit status/type/priority/duration constraints.
3. Non-null/defaulted column additions on populated shared tables.
4. RLS policy replacement catalog activity across 173 policies.

## Failure behavior

- A lock timeout aborts the current transactional stage without rolling back earlier committed stages.
- A concurrent index failure can leave an invalid index entry.
- RLS stage failure rolls back that stage, but a successful RLS stage followed by storage failure remains committed.
- The current stage 001 dependency failure occurs before commit and rolls stage 001 back completely.

## Recommended deployment window

After blockers are resolved and production-scale clone timings exist, reserve a **90-minute low-traffic maintenance window plus 60 minutes of observation**. Pause bulk imports, workflow workers, notification/email queues, Creative generation, analytics aggregation, and administrative schema activity. Assign a database operator, application operator, reviewer, rollback owner, and incident commander.

Current lock readiness: **UNPROVEN / NO-GO**.
