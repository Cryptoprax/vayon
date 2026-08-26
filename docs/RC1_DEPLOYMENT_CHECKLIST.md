# VAYON RC1 deployment checklist

Deployment was not performed during Sprint 152.

## Before deployment

- [ ] All Critical and High RC1 issues are closed.
- [ ] Release commit/tag is identified and reproducible from a clean checkout.
- [ ] `npm ci`, `npm run validate`, and performance audit pass in CI.
- [ ] Database reconciliation and post-deploy checks pass on a restored clone.
- [ ] Backups and a timed restore rehearsal are verified.
- [ ] Paddle sandbox checkout, webhook, subscription, portal, invoices, and lifecycle changes pass.
- [ ] Production Paddle IDs, webhook secret, environment, and allowlisted URLs are independently reviewed.
- [ ] Supabase URLs/keys, application URL/version, email, AI, and monitoring configuration are present without exposing secrets.
- [ ] DNS, TLS, security headers, email authentication, alerting, quotas, and health endpoints are verified.
- [ ] Two-tenant authentication/RBAC/isolation matrix passes.
- [ ] Browser, responsive, visual, performance, and accessibility matrices pass.
- [ ] Release notes, known issues, rollback owner, support owner, and incident channel are approved.

## Deployment window

- [ ] Announce start and freeze unrelated changes.
- [ ] Record current application revision and database state.
- [ ] Apply only reviewed, ordered database changes; save verification output.
- [ ] Deploy the identified RC artifact without rebuilding from a different revision.
- [ ] Verify live/readiness/version endpoints, public 200s, protected redirects, and API non-redirect behavior.
- [ ] Execute one controlled signup-to-portal canary and confirm webhook/subscription correlation.
- [ ] Monitor errors, latency, auth failures, webhook failures, and support channels through the observation window.

## Approval

- [ ] Engineering owner
- [ ] Security/data owner
- [ ] Billing owner
- [ ] Product/release owner
- [ ] Support/operations owner
