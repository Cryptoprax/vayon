# Vayon Operations Runbook

## Monitoring contract

The runtime emits structured JSON logs with event, level, timestamp, and correlation ID. Sensitive field names are redacted. `instrumentation.ts` captures server request failures through the existing logger. Sentry and OpenTelemetry implement the provider-neutral adapter later; both are disconnected in Release 2.0.

## Health interpretation

- Liveness `200`: the Next.js process can serve requests.
- Readiness `200`: required configuration is present and Supabase responds to a read-only query.
- Readiness `503 degraded`: required configuration is incomplete.
- Readiness `503 not_ready`: Supabase configuration or connectivity failed.

Do not send liveness or readiness payloads to public analytics. Alerts should key on status code and deployment/build metadata, never credentials.

## Incident response

1. Declare severity and assign an incident commander.
2. Capture UTC start time, build ID, commit SHA, environment, affected routes, and correlation IDs.
3. Check Vercel deployment status, function logs, readiness, Supabase status, DNS resolution, and recent configuration changes.
4. Roll back the web deployment when the current build is implicated. Do not modify the database as part of an application rollback without a separate approved plan.
5. Communicate status without tenant data or secrets.
6. Close with a timeline, root cause, corrective actions, and owners.

## Security operations

CSP is report-only for the first deployment. Review violations, remove unnecessary sources, then schedule enforcement. HSTS is emitted outside development. Authentication, webhooks, exports, and server actions are identified rate-limit boundaries; enforcement requires a shared provider and is not simulated in-process. Verify trusted origins before enabling cross-origin mutation traffic.

## Backups and recovery

Enable Supabase production backups and point-in-time recovery according to the service tier. Test restoration into an isolated project. Recovery validation must cover Auth configuration, Storage metadata and objects, database migrations, and application secrets.

## Deployment and migration process

1. Promote only a commit that passed TypeScript, ESLint, regression, audit and production-build gates.
2. Run the Version 1.0 migration audit and compare the expected migration with the deployed migration history.
3. Apply migrations to staging in timestamp order. Verify RLS, RPC execution permissions, indexes, storage buckets and rollback implications.
4. Run authenticated smoke tests and provider health checks in staging.
5. Deploy the same immutable build to production, apply approved migrations and record build ID, commit SHA, operator and UTC time.
6. Do not roll back a database migration by rolling back the web deployment. Use a separately reviewed forward repair unless a tested reversible migration exists.

## Application rollback

Select the last certified immutable deployment, verify its environment contract, and promote it through the hosting provider. Confirm readiness, authentication, tenant isolation and mission-critical forms. Record the reason, correlation IDs and affected interval.

## Database restore and disaster recovery

Follow `BACKUP_AND_RECOVERY_RUNBOOK.md`. Restore into isolation, verify integrity and authorization, and require business-owner approval before any production cutover. Never test a restore by overwriting production.

## Key rotation

1. Identify the credential reference and dependent provider without logging the secret.
2. Create the replacement in the provider and approved secret manager.
3. deploy, validate health and signed callbacks, then revoke the old key.
4. Rotate webhook secrets with a controlled overlap where supported.
5. Record actor, provider, reference, time and outcome in the audit system; never record the credential value.
