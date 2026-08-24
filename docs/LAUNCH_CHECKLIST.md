# VAYON Version 5 Launch Checklist

## Critical release gates

- [x] TypeScript passes.
- [x] ESLint has zero errors.
- [x] 1,115 regression tests pass.
- [x] Production build passes with 334 generated pages.
- [x] Production dependency audit reports zero vulnerabilities.
- [x] Static database package and dependency rehearsal pass.
- [ ] Fresh production database and storage backup verified.
- [ ] Backup restored and verified in an isolated production clone.
- [ ] `PRE_DEPLOY_VALIDATION.sql` output archived and approved.
- [ ] Operator, reviewer, rollback owner, incident channel, and maintenance window recorded.
- [ ] Database stages 004–008 executed sequentially and archived.
- [ ] `POST_DEPLOY_VALIDATION.sql` passes against production.
- [ ] Production application smoke tests pass after database deployment.

## Application journey

- [ ] Visitor landing journey verified in production browser.
- [ ] Signup and email verification verified.
- [ ] Organization and workspace provisioning verified.
- [ ] Team invitation and acceptance verified.
- [ ] CRM, properties, and projects verified under tenant isolation.
- [ ] Marketing and Sales recommendations verified.
- [ ] Workflow approval and execution verified.
- [ ] Subscription, invoice, and payment webhooks verified.
- [ ] Reporting and Founder monitoring verified.

Repository/source coverage for these flows: **PASS**. Live end-to-end status: **NOT VERIFIABLE**.

## Providers

- [ ] OpenAI billing/quota healthy; model, streaming, latency, usage, and fallback verified.
- [ ] Resend/email provider health, SPF, DKIM, DMARC, bounce, and delivery verified.
- [ ] Google OAuth, Calendar, Analytics, Ads, Search Console, and Business scopes/callbacks verified where enabled.
- [ ] Microsoft OAuth, Graph, Calendar, and Teams scopes/callbacks verified where enabled.
- [ ] Stripe live mode, signatures, checkout, portal, invoices, and webhooks verified.
- [ ] Razorpay live mode, signatures, payments, and webhooks verified.
- [ ] WhatsApp verification, signatures, Graph version, send/receive, and retries verified.
- [ ] Meta, LinkedIn, Twilio, and other optional providers explicitly Healthy, Disabled, or Disconnected.
- [ ] Provider failures degrade gracefully and never display fake health.

Provider adapter architecture: **PASS**. Live status: **NOT VERIFIABLE**, except OpenAI currently reports **Billing required** in this certification environment.

## Database and security

- [x] Static tables, columns, indexes, functions, policies, triggers, buckets, and dependencies audited.
- [x] Package contains guarded, staged, idempotent reconciliation.
- [ ] Live tables, columns, indexes, functions/RPCs, policies, triggers, views, buckets, storage, RLS, foreign keys, and constraints verified after deployment.
- [ ] Production tenant-isolation and Founder-isolation probes pass.
- [ ] Rate limits verified at authentication, API, AI, workflow, notification, email, and search boundaries.
- [ ] Session expiry, refresh, revocation, MFA, CSRF, XSS, injection, and security logging exercised in production candidate.
- [ ] Backup restore, rollback, key rotation, and incident response rehearsed.

## UX and performance

- [x] Theme, semantic token, source accessibility, navigation, CTA, empty-state, loading, and floating-layout audits pass.
- [ ] Authenticated visual verification and screenshots completed.
- [ ] Keyboard and screen-reader journey completed.
- [ ] Chrome, Edge, Safari, and Firefox compatibility recorded.
- [ ] Mobile, tablet, and desktop screenshots approved.
- [ ] p75 LCP, CLS, and INP meet budgets.
- [ ] API, database, workflow, notification, and AI latency meet SLOs.
- [ ] Memory and sustained-load behavior verified.

## Operations

- [ ] Production environment variable names validated in the deployment control plane without exposing values.
- [ ] DNS, TLS, canonical host, OAuth redirects, and webhook endpoints verified.
- [ ] Sentry/monitoring and analytics events verified.
- [ ] Alerts reach the named on-call responder.
- [ ] Support email and escalation paths verified.
- [ ] Launch dashboard shows truthful application, database, provider, queue, storage, and build status.
- [ ] Founder signs final GO decision after all critical gates pass.

## Current status

**NO GO.** Critical database deployment, environment/provider, post-deploy, and live journey gates remain open.
