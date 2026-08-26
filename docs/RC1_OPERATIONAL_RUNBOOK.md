# VAYON RC1 operational runbook

## Routine checks

Check application live/readiness/version endpoints, authentication success/failure trends, API 4xx/5xx, page latency, queue/process health, Paddle webhook delivery, subscription synchronization, email delivery, AI provider health, database capacity, backups, and certificate expiry. Never log secrets, tokens, raw payment data, or sensitive AI payloads.

## Incident triage

1. Establish severity, affected tenants/modules, start time, and current revision.
2. Use correlation IDs to trace application, webhook, provider, and audit events.
3. Test public availability separately from protected application access.
4. Test API handlers directly; middleware must not redirect API requests.
5. Contain with approved fail-closed controls. Do not bypass RBAC, tenant isolation, approval gates, or billing reconciliation.
6. Escalate to rollback when a trigger in `RC1_ROLLBACK_CHECKLIST.md` is met.

## Billing incident procedure

Record Paddle event, customer, subscription, transaction, organization, and workspace identifiers. Confirm signature verification, idempotency, processing status, and synchronization order. Pause customer-visible mutation if duplicate charging or entitlement drift is possible. Reconcile before replaying events; never manually invent subscription state.

## Authentication or isolation incident

Treat suspected cross-organization/workspace access as Critical. Preserve logs, revoke affected sessions through approved authentication controls, contain access, and notify the security owner. Do not weaken middleware, RLS, RBAC, or permission checks to restore availability.

## AI incident procedure

Fail closed when provider health or evidence is unavailable. Preserve preview/confirmation boundaries. Do not present fabricated metrics, recommendations, or execution results. Record only safe diagnostics and correlation IDs.

## Communications

Maintain an incident timeline with owner, decisions, evidence, user impact, mitigations, and next update time. Customer communication must distinguish confirmed impact from investigation and provide a recovery action when available.

## Useful commands

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run audit:v1:performance`
- `npm run validate`

Run commands against the exact release revision. Production mutations, deployment, database changes, provider changes, and webhook replay require the respective owner and approved runbook.
