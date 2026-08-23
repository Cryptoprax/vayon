# Version 1 deployment rollback runbook

## Principles

- Never improvise destructive reverse SQL.
- Never delete customer rows to make validation pass.
- Never repair or fabricate migration history.
- Prefer stopping between independently committed stages.
- A committed additive object may safely remain unused while recovery is assessed.

## Failure scenarios

### Preflight conflict

Stop before deployment. Capture the conflicting definition and production catalog evidence. Generate a separately reviewed repair only after proving semantic intent.

### Stage transaction fails

`001`, `002`, `004`, `005`, `006`, and `007` are independent transactions. PostgreSQL rolls the failed stage back. Confirm the session is no longer in an aborted transaction, archive the error, and do not proceed.

### Concurrent index fails

Stop stage `003`. Inspect for an invalid index using read-only catalog queries. Do not drop it automatically. Any cleanup requires a separately approved statement and dependency review.

### Post-deploy validation fails

Disable application paths that require the new schema. Preserve additive objects unless they cause a verified incident. Compare the clone rehearsal and production catalog. Restore the verified backup only when data integrity or availability cannot be recovered safely in place.

### RLS or permission regression

Stop traffic to the affected module, revoke exposed application access at the edge if necessary, preserve audit evidence, and restore the verified database backup or apply a separately reviewed policy correction. Treat possible cross-tenant exposure as a security incident.

## Recovery checklist

- [ ] Incident commander and rollback owner assigned.
- [ ] Writes paused for affected modules.
- [ ] Failed stage, statement, SQLSTATE, request IDs, and timestamps captured.
- [ ] Database connections, locks, replication, storage, and queues assessed.
- [ ] Backup integrity and restore point confirmed.
- [ ] Recovery rehearsed on a clone.
- [ ] Tenant isolation and RBAC retested.
- [ ] Post-deploy validation rerun read-only.
- [ ] Application smoke tests and provider health checks pass.
- [ ] Incident and final catalog state documented.

## Rollback limitations

There is no automatic down migration. Once later application versions write data into new structures, dropping those structures would destroy production data. Backup restoration also reverts legitimate writes after the restore point and therefore requires an explicit business continuity decision.
