# Trial Enforcement Certification

**Final state: Needs Verification**

The commercial write policy is implemented and passes local application, browser, build, and isolated PostgreSQL checks. It has not been applied to or exercised against a deployed VAYON database, so production certification would be inaccurate. No commit, deployment, production migration, or production-data mutation was performed.

## Enforcement model

`SubscriptionWriteService` is the single application policy boundary. It reuses the authenticated user, selected organization/workspace context, existing founder entitlement, and the existing subscription row. It does not replace RBAC: existing permission checks continue to decide whether an authenticated user may perform an operation.

For trial workspaces, the service calls `check_workspace_subscription_write`. The database function reuses `current_workspace_role`, locks the workspace subscription row, checks the persisted deadline, and calculates live quota usage. Row triggers apply the same policy inside the transaction, preventing direct calls, concurrent requests, batches, soft-delete restoration, workspace moves, invitation acceptance, and worker execution from bypassing the preflight.

Existing non-trial subscriptions retain their prior behavior. Their established plan and entitlement rules remain authoritative, and the new trial RPC is not called. No records are deleted by this implementation.

## Protected write paths

The source inventory found and protected **84 server actions in 30 action modules**, plus **5 content-generating API POST routes**. The detailed machine-readable list, including deliberately exempt authentication, billing, webhook, telemetry, recovery, and personal-preference operations, is in [`test-results/trial-enforcement/guarded-paths.json`](test-results/trial-enforcement/guarded-paths.json).

Quota-specific entry points are:

- Properties: `createPropertyAction`, limit 1 live property.
- Leads: `createLeadAction`, limit 2 live leads.
- Companies: `createCompanyAction`, limit 1 live company.
- Team: `inviteMemberAction`, limit 2 total occupied/reserved seats (the initial owner plus one additional member). Pending, unexpired invitations reserve a seat and acceptance does not count it twice.

The shared write guard also protects updates and deletes for properties, leads, companies, contacts, deals, tasks, meetings, visits, communications, organization/team administration, workflows, knowledge, integrations, property matching/inventory, campaigns and creative assets. Content-producing AI, image, video, document, collaboration, and recommendation entry points use the same guard. Claimed background generation jobs are checked against the job's actual workspace before provider work begins.

The five guarded API routes are:

- `app/api/ai/workforce/chat/route.ts`
- `app/api/ai/workforce/collaborate/route.ts`
- `app/api/creative/documents/stream/route.ts`
- `app/api/creative/images/stream/route.ts`
- `app/api/creative/videos/stream/route.ts`

The transactional trigger covers workspace-owned operational tables when present, including CRM records, property records, deals, tasks/calendar, communications, team invitations/memberships, creative/campaign data, AI outputs, knowledge, workflows, integrations, and WhatsApp connections. Billing/subscription state, authentication/recovery, provider webhooks, telemetry, audit records, notification read receipts, and personal preferences are excluded so the user can authenticate, recover access, view data, and upgrade.

## Blocked experience

Expired trials are read-only for operational writes. Reads, search, dashboards, analytics views, and existing records remain accessible. Limit, expiry, and unverifiable-subscription failures carry a bounded code and resource instead of a generic error. Server actions redirect to `/vayon/settings/billing`; API and streaming clients dispatch the same in-app destination. Authenticated users are never sent to the public website.

The Subscription Center opens automatically with the relevant explanation. Users without billing-view permission receive a limited plan view and guidance to contact a workspace owner; financial records and management controls are not exposed. Existing RBAC errors are preserved and are never converted into subscription errors.

## Validation evidence

- TypeScript: passed (`tsc --noEmit`).
- ESLint: passed with no reported errors or warnings.
- Regression tests: **1,679 passed, 0 failed**.
- Focused commercial guard tests: **10 passed, 0 failed**. These cover paid compatibility, unauthenticated rejection, founder behavior, selected/target workspace scoping, fail-closed verification, in-app redirects, database error transport, pre-persistence blocking, read continuity, and inventory wiring.
- Isolated PostgreSQL runtime: **11 scenarios passed** using the actual migrations and existing membership helper. Evidence includes atomic quota rejection, batch rollback, invitation reservation/acceptance, expiry, retained reads/data, upgrade recovery, soft-delete recovery, nonmember rejection, and worker workspace isolation.
- Production build: passed under Next.js 16.3.0.
- Commercial UX, CTA migration, and production-readiness audits: passed.
- Responsive/accessibility interaction audit: passed in Chromium at 320, 375, 768, 1024, 1280, 1440, 1600, 1920, and 2560 px. No horizontal overflow; dialog focus remained contained; Escape dismissed and restored the flow; API 402 opened the in-app center.
- Diff integrity: `git diff --check` passed (Git reported line-ending notices only).

Logs and structured results are under [`test-results/trial-enforcement`](test-results/trial-enforcement), including PostgreSQL evidence, browser evidence, screenshots, the write inventory, TypeScript, ESLint, regressions, focused tests, and build output.

## Primary implementation files

- `features/vayon/billing/services/subscription-write.service.ts`
- `features/vayon/billing/services/subscription-write-guard.ts`
- `features/vayon/billing/services/subscription-write-contract.ts`
- `features/vayon/billing/components/SubscriptionResponseHandler.tsx`
- `features/vayon/billing/components/SubscriptionCenter.tsx`
- `app/vayon/settings/billing/page.tsx`
- `supabase/migrations/20261030000000_sprint233_workspace_trial.sql`
- `supabase/migrations/20261030010000_sprint233_trial_enforcement.sql`
- the 30 action modules and 5 API routes listed by the inventory artifact
- `tests/trial-enforcement.test.mjs`
- `scripts/certify-trial-database.mjs`
- `scripts/certify-trial-experience.mjs`
- `scripts/inventory-trial-writes.mjs`

Two existing regression fixtures were updated to provide an active paid subscription to the real centralized guard: `tests/property-creation-workflow.test.mjs` and `tests/marketing-workflow-certification.test.mjs`.

## Performance impact

Each interactive write performs one indexed subscription lookup. Trial writes then call one shared policy RPC; paid workspaces return after the subscription lookup and do not execute quota counts. Transaction triggers serialize trial writes per workspace only. Reads add no guard query. No duplicate business-data fetcher, repository, service, schema, or authorization catalog was introduced.

## Remaining verification

- Apply both prepared migrations in a non-production environment and run the full real Supabase migration chain.
- Verify independent database-session concurrency against hosted PostgreSQL; the local PostgreSQL WASM runtime uses one process and does not certify multi-connection lock behavior.
- Exercise authenticated Owner, Admin, Manager, Agent, and read-only sessions against the deployed environment to confirm existing RBAC behavior alongside subscription failures.
- Exercise real invitation delivery/acceptance and real provider-backed AI/campaign jobs. Local checks certify persistence boundaries and UI transport, not third-party delivery.
- Re-run the write inventory whenever a new server action, API mutation, operational table, or background worker is added; the current inventory is a point-in-time certification.
