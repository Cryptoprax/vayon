# Backup and Recovery Runbook

## Policy

Production operators must configure Supabase database backups and point-in-time recovery according to the contracted recovery objectives. Storage and configuration backups require independent encrypted copies. The application does not initiate backups automatically.

## Minimum schedule

- Database: daily backup plus point-in-time recovery where supported.
- Storage: daily incremental copy and weekly integrity inventory.
- Configuration: encrypted export after every approved change; quarterly key inventory review.
- Restore drill: quarterly and before a material migration campaign.

## Restore procedure

1. Declare the recovery incident, owner, target recovery point and isolated restore destination.
2. Freeze writes when required and preserve logs, build metadata and migration history.
3. Restore the database into an isolated Supabase project. Never overwrite production during verification.
4. Restore storage objects and compare object counts, checksums, bucket privacy and tenant paths.
5. restore environment configuration through the approved secret manager and rotate exposed credentials.
6. Run migrations only after comparing restored and expected versions.
7. Validate authentication, tenant isolation, RLS, RPCs, billing webhooks, queues and representative records.
8. Record recovery point achieved, recovery duration, discrepancies and approval before cutover.

## Recovery validation

Successful restoration requires database integrity checks, storage checksum sampling, RLS/RBAC regression tests, signed webhook verification, application readiness, and documented business-owner approval.
