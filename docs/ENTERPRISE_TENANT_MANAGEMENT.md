# Enterprise Tenant Management

## Outcome

Sprint 113 adds the Founder-only Enterprise Tenant Management console at `/platform/founder/tenants`. It composes the existing customer directory, Customer Growth health engine, Founder metrics, subscriptions, renewal evidence, organization RBAC, onboarding, billing limits, activity, and audit surfaces. It does not introduce a second tenant, subscription, provisioning, or health implementation.

## Tenant center

The searchable directory displays organizations, lifecycle, subscriptions, plan, users, workspaces, measured AI usage, integration availability, customer health, support load, renewal confidence, and last activity. Trial, Active, Past Due, Suspended, Cancelled, and Archived states normalize existing organization and subscription statuses. The current lifecycle is evidence-backed; historical events remain in the existing activity and audit systems.

## Subscription and usage operations

Plan, renewal date, billing state, and plan-limit ownership come from existing subscription and billing contracts. AI and active-user usage use existing directory evidence. API, storage, workflow, knowledge, marketing, sales, customer-success, creative, and integration measurements remain explicitly unavailable where no authoritative cross-tenant meter exists. No values are fabricated.

## Tenant health

Business health, adoption, activity, risk, support demand, and renewal confidence reuse the existing Customer Growth health model. Every tenant exposes confidence and supporting reasons. Expansion opportunities are counted from existing evidence and are recommendations only.

## Founder operations

Suspend, Reactivate, Reset onboarding, Transfer ownership, Export metadata, Trigger health review, and View audit history are Founder-only operational handoffs. Sensitive operations are labeled confirmation-required and delegate to existing organization, customer-success, customer-directory, and audit surfaces. Sprint 113 does not add unproven database mutations or provider calls.

## Provisioning

The console identifies the existing owner for workspace provisioning, default roles, AI configuration, feature entitlements, plan assignment, and starter templates. Onboarding, organization RBAC, AI Workforce, billing limits, subscriptions, and workflow templates retain their authorization, tenant isolation, and approval rules.

## Security and release boundaries

Founder access fails closed through `founderContext`. Repository reads use the authenticated Founder client and existing platform RPCs. No live provider was connected. No deployment, database reconciliation, migration, migration history, authentication provider, or production data was modified. No deployment or commit was created.

## Validation

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS — zero errors; one pre-existing release-report warning |
| Sprint 113 tests | PASS — 8/8 |
| Full regression suite | PASS — 1,107/1,107 |
| Production build | PASS — 334 generated pages |
| Founder RBAC audit | PASS — route and service access fail closed through Founder context |
| Accessibility / UX audit | PASS |
| Performance audit | PASS |
| Responsive / floating-layout audit | PASS — 196 authenticated `/vayon` routes and zero unmanaged surfaces |
| Theme / production readiness | PASS |
