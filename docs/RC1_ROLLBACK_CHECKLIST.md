# VAYON RC1 rollback checklist

## Triggers

Rollback for authentication loops, cross-tenant exposure, billing duplication or incorrect entitlements, failed migrations, sustained 5xx/latency, webhook corruption, or unavailable core journeys.

## Actions

- [ ] Declare incident, assign commander, timestamp the decision, and freeze changes.
- [ ] Disable affected feature/provider using approved fail-closed controls where that safely contains impact.
- [ ] Restore the last known-good application artifact.
- [ ] Stop billing retries or webhook replay only through documented provider controls; never discard signed events.
- [ ] Do not reverse database changes blindly. Follow the reviewed database rollback/recovery runbook and preserve audit evidence.
- [ ] Verify public routes, login, protected routes, tenant isolation, health endpoints, and one read-only customer journey.
- [ ] Reconcile Paddle events, subscriptions, entitlements, and invoices before resuming mutations.
- [ ] Notify internal stakeholders and affected customers using the approved incident template.
- [ ] Preserve logs, correlation IDs, provider event IDs, timings, and deployed revisions.

## Recovery exit

- [ ] Root cause and blast radius are understood.
- [ ] Data and billing reconciliation are complete.
- [ ] Monitoring is stable for the agreed observation window.
- [ ] Incident commander and service owners approve restoration.
- [ ] Follow-up defects have owners and deadlines.
