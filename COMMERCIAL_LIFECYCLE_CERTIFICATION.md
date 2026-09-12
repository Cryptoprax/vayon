# Sprint 233 — Commercial Lifecycle & Subscription Experience

**Final state: Needs Verification. The previously pending trial-enforcement scope was approved and implemented; deployed production verification remains outstanding.**

The in-app billing experience, new-workspace trial-duration migration, centralized trial quotas, and read-only write enforcement are prepared. The enforcement evidence and remaining production boundary are documented in `TRIAL_ENFORCEMENT_CERTIFICATION.md`.

No commit, deployment, database migration application, real payment, or production subscription change was performed.

## Evidence boundary

- [Source inventory and configuration-presence evidence](test-results/commercial-lifecycle/source-evidence.json)
- [Browser evidence](test-results/commercial-lifecycle/browser-evidence.json)
- [Browser execution log](test-results/commercial-lifecycle/browser.log)
- [Pre-sprint worktree status](test-results/commercial-lifecycle/pre-sprint-status.txt)

Browser evidence uses the actual React components and compiled application CSS in local Chromium. Records and prices are explicitly fictional QA fixtures; HTTP checkout, payment SDK and server actions are mocked. It proves presentation and client interaction behavior, not real payment delivery, authentication, subscription persistence or webhook processing. Production at `https://vayon.online` was not authenticated or tested during this sprint.

## Trial flow

1. The existing workspace-creation billing trigger remains the provisioning entry point.
2. The prepared migration changes `provision_workspace_billing` from fourteen days to three days, using the existing `subscriptions` row and timestamps.
3. `ON CONFLICT(workspace_id) DO NOTHING` is retained. Existing subscriptions are not backfilled or reset. No second trial record or new trial table is introduced.
4. The commercial plan catalog's trial duration is also updated to three days.
5. The workspace shell displays the persisted trial deadline and current workspace counts. Additional team members are active members minus the initial member.
6. Unknown counts display an unconfirmed state rather than fabricated zeroes. Missing deadlines do not produce an invented countdown.

Both migrations and the existing membership helper pass an isolated PostgreSQL runtime exercise. They have not been applied to a deployed Supabase environment; hosted multi-connection and authenticated role verification remain outstanding.

The displayed limits are enforced by the centralized application and transactional database guards documented in `TRIAL_ENFORCEMENT_CERTIFICATION.md`.

## Upgrade flow

- Upgrade Now and Compare Plans open the Subscription Center dialog inside VAYON.
- Starter, Professional and Enterprise comparison uses the existing entitlement catalog. Prices come from the existing provider catalog, with monthly/annual selection preserved.
- Enterprise has no invented price or fake checkout. Its existing self-service catalog does not provide an Enterprise checkout; the UI explains the contract requirement.
- Checkout posts to the existing workspace-scoped billing endpoint. That endpoint now returns the provider transaction ID alongside its existing response fields.
- The payment SDK opens an overlay. The client no longer navigates to the returned checkout URL.
- Checkout completion closes the overlay and polls the server subscription projection, bounded to ten checks. Only a server-confirmed active subscription produces the active-plan message. A delayed confirmation remains explicit.
- Polling verifies that the selected workspace still matches the checkout workspace. It stops updating after component unmount.
- A workspace with an existing non-cancelled provider subscription is directed to management instead of opening a second subscription checkout.

Local mocked checkout checks passed. Real checkout and payment confirmation remain **Needs Verification**. Required provider configuration was absent from the inspected `.env.local`; only presence booleans were recorded, never values. Process/deployment secrets were not certified. No authenticated QA session file was provided.

## Billing flow

The customer billing page now presents current plan, trial status, remaining days, usage, plan comparison, invoices, payment methods, billing history and renewal management. Provider configuration and health diagnostics are no longer rendered there.

- `/vayon/settings/subscription` and `/vayon/settings/plans` redirect to `/vayon/settings/billing`.
- The former customer provider-health page also redirects to the Subscription Center; implementation code and internal diagnostic services are retained.
- Customer billing screens no longer render the external portal buttons. Invoice downloads remain the existing invoice functionality.
- Payment-method updates use a workspace-authorized transaction in the payment overlay.
- Existing subscription operations handle plan changes and cancellation. Cancellation requires confirmation; keeping a scheduled-to-cancel active subscription clears its scheduled change.
- Billing mutations retain the existing manager role set and verify the current authenticated user, organization and workspace. The previous billing-context query did not filter by actor; it now does.
- Plan updates preserve the existing seat quantity and validate the subscription version. No role catalog, permission policy or authentication flow was changed.
- Billing search synonyms—Billing, Upgrade, Subscription, Plan, Pricing, Trial and Payment—match the existing permission-filtered billing destination, with billing intents ranked first.

The provider integrations are implemented but not payment-certified. Enterprise self-service purchasing, provider configuration, live payment-method updates, live cancellation/retention, and webhook latency remain verification or commercial configuration blockers.

## Workspace lock flow — Needs Verification

The centralized guard covers operational create, edit, delete, invite, publish, and generation entry points while retaining existing authentication and RBAC decisions. Database triggers provide transactional enforcement for workspace-owned operational records.

The banner identifies expired trials as read-only, and blocked actions open the in-app Subscription Center. Records are never deleted by enforcement.

Local code, browser, and isolated PostgreSQL evidence passed. The remaining verification is:

- Apply the migrations to hosted Supabase and exercise independent database sessions.
- Verify authenticated Owner, Admin, Manager, Agent, and read-only sessions.
- Verify real invitation delivery and provider-backed generation.

See `TRIAL_ENFORCEMENT_CERTIFICATION.md` for the enforcement inventory and exact evidence boundary.

## Responsive and accessibility validation

The browser run tested 320, 375, 768, 1024, 1280, 1440, 1600, 1920 and 2560 pixel widths. It also tested the reserved notice at 320 × 568.

- No document or comparison-dialog horizontal overflow at the nine tested widths.
- Trial notice remains visible in a reserved row while workspace content scrolls.
- Named native dialogs; explicit Tab containment, Escape dismissal and focus restoration.
- Labeled billing inputs and plan selectors; status announcements for checkout and management responses.
- Cancellation confirmation and dismiss behavior tested.
- Sampled title/body contrast passes AA in both themes: light 13.49:1 / 6.18:1, dark 17.41:1 / 5.64:1.
- No unhandled browser exceptions in the fixture run.

Twenty-three screenshots were generated in [screenshots](test-results/commercial-lifecycle/screenshots). Examples:

| Screen | Evidence |
| --- | --- |
| Desktop billing | [1440 px](test-results/commercial-lifecycle/screenshots/billing-1440.png) |
| Desktop comparison | [1440 px](test-results/commercial-lifecycle/screenshots/comparison-1440.png) |
| Mobile comparison, dark | [375 px](test-results/commercial-lifecycle/screenshots/comparison-dark-375.png) |
| Mobile comparison, light | [375 px](test-results/commercial-lifecycle/screenshots/comparison-light-375.png) |
| Trial ended | [Expired fixture](test-results/commercial-lifecycle/screenshots/expired.png) |
| Missing configuration | [Unavailable checkout fixture](test-results/commercial-lifecycle/screenshots/unconfigured.png) |

These checks are not a complete WCAG audit. Screen-reader application testing, Safari/Firefox, physical devices and the real payment overlay remain unverified.

## Validation results

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed | [Log](test-results/commercial-lifecycle/typecheck.log) |
| Whole-repository ESLint | Passed | [Log](test-results/commercial-lifecycle/eslint.log) |
| Validation scripts ESLint | Passed | [Log](test-results/commercial-lifecycle/validation-scripts-eslint.log) |
| Existing regression suite plus trial tests | 1,669 passed; zero failed/skipped | [Log](test-results/commercial-lifecycle/regression.log) |
| Production build | Passed | [Log](test-results/commercial-lifecycle/build.log) |
| Component responsive/interaction checks | Passed, with the limits above | [Evidence](test-results/commercial-lifecycle/browser-evidence.json) |
| PostgreSQL migration runtime | Passed locally | Actual SQL passed 11 isolated PostgreSQL WASM scenarios; hosted Supabase remains unverified |
| Real billing lifecycle | Needs Verification | Missing local provider configuration and authenticated production session |
| Quotas and universal read-only enforcement | Passed locally | Central guard, transactional triggers, browser behavior and 10 focused tests passed; deployed verification remains |

Older tests that required public contact links, external checkout redirects or provider branding in customer pages were updated for this sprint's behavior. Provider validation, telemetry and error containment assertions remain. New tests cover exact trial boundaries, missing timestamps, provisioning idempotency source, actor-scoped billing authority and server-confirmed payment state.

## Performance impact

The request-cached trial snapshot is shared by the shell and billing page. It adds a subscription read and four exact count reads, plus the existing authentication/workspace context lookups. No per-second data fetching is used: the visible countdown uses the supplied deadline. Payment confirmation makes at most ten subscription checks only after checkout completion. The SDK is loaded only when checkout opens. Production query latency has not been measured.

## Modified files

The following list is specific to Sprint 233; prior uncommitted work was preserved. Evidence files and snapshots under `test-results/commercial-lifecycle/` are generated artifacts. Temporary edit scripts were removed.

- [COMMERCIAL_LIFECYCLE_CERTIFICATION.md](COMMERCIAL_LIFECYCLE_CERTIFICATION.md)
- [app/api/billing/paddle/checkout/route.ts](app/api/billing/paddle/checkout/route.ts)
- [app/vayon/settings/billing/page.tsx](app/vayon/settings/billing/page.tsx)
- [app/vayon/settings/billing/provider-health/page.tsx](app/vayon/settings/billing/provider-health/page.tsx)
- [app/vayon/settings/payment-methods/page.tsx](app/vayon/settings/payment-methods/page.tsx)
- [app/vayon/settings/plans/page.tsx](app/vayon/settings/plans/page.tsx)
- [app/vayon/settings/subscription/page.tsx](app/vayon/settings/subscription/page.tsx)
- [features/platform/design-system/layout/WorkspaceLayouts.tsx](features/platform/design-system/layout/WorkspaceLayouts.tsx)
- [features/platform/design-system/layout/workspace.css](features/platform/design-system/layout/workspace.css)
- [features/vayon/billing/actions/subscription-center.actions.ts](features/vayon/billing/actions/subscription-center.actions.ts)
- [features/vayon/billing/components/BillingForms.tsx](features/vayon/billing/components/BillingForms.tsx)
- [features/vayon/billing/components/BillingRecoveryState.tsx](features/vayon/billing/components/BillingRecoveryState.tsx)
- [features/vayon/billing/components/BillingUI.tsx](features/vayon/billing/components/BillingUI.tsx)
- [features/vayon/billing/components/CommercialBilling.tsx](features/vayon/billing/components/CommercialBilling.tsx)
- [features/vayon/billing/components/CommercialPlatform.tsx](features/vayon/billing/components/CommercialPlatform.tsx)
- [features/vayon/billing/components/SubscriptionCenter.tsx](features/vayon/billing/components/SubscriptionCenter.tsx)
- [features/vayon/billing/components/SubscriptionManagement.tsx](features/vayon/billing/components/SubscriptionManagement.tsx)
- [features/vayon/billing/components/WorkspaceTrialBanner.tsx](features/vayon/billing/components/WorkspaceTrialBanner.tsx)
- [features/vayon/billing/components/checkout-overlay.ts](features/vayon/billing/components/checkout-overlay.ts)
- [features/vayon/billing/components/dialog-keyboard.ts](features/vayon/billing/components/dialog-keyboard.ts)
- [features/vayon/billing/config/commercial-plans.ts](features/vayon/billing/config/commercial-plans.ts)
- [features/vayon/billing/config/trial.ts](features/vayon/billing/config/trial.ts)
- [features/vayon/billing/providers/paddle/paddle.provider.ts](features/vayon/billing/providers/paddle/paddle.provider.ts)
- [features/vayon/billing/services/billing-context.ts](features/vayon/billing/services/billing-context.ts)
- [features/vayon/billing/services/billing-stability.service.ts](features/vayon/billing/services/billing-stability.service.ts)
- [features/vayon/billing/services/paddle-checkout.service.ts](features/vayon/billing/services/paddle-checkout.service.ts)
- [features/vayon/billing/services/workspace-trial.ts](features/vayon/billing/services/workspace-trial.ts)
- [features/vayon/components/ProductExperience.tsx](features/vayon/components/ProductExperience.tsx)
- [features/vayon/components/VayonShell.tsx](features/vayon/components/VayonShell.tsx)
- [features/vayon/universal-bar/providers/static-navigation.provider.ts](features/vayon/universal-bar/providers/static-navigation.provider.ts)
- [features/vayon/universal-bar/services/universal-search.service.ts](features/vayon/universal-bar/services/universal-search.service.ts)
- [next.config.ts](next.config.ts)
- [scripts/audit-commercial-lifecycle.mjs](scripts/audit-commercial-lifecycle.mjs)
- [scripts/certify-commercial-lifecycle.mjs](scripts/certify-commercial-lifecycle.mjs)
- [supabase/migrations/20261030000000_sprint233_workspace_trial.sql](supabase/migrations/20261030000000_sprint233_workspace_trial.sql)
- [tests/billing-stability-hotfix.test.mjs](tests/billing-stability-hotfix.test.mjs)
- [tests/fixtures/commercial-lifecycle/actions.mjs](tests/fixtures/commercial-lifecycle/actions.mjs)
- [tests/fixtures/commercial-lifecycle/entry.jsx](tests/fixtures/commercial-lifecycle/entry.jsx)
- [tests/fixtures/commercial-lifecycle/navigation.mjs](tests/fixtures/commercial-lifecycle/navigation.mjs)
- [tests/sprint143-paddle-billing-platform.test.mjs](tests/sprint143-paddle-billing-platform.test.mjs)
- [tests/sprint145-paddle-billing-ui.test.mjs](tests/sprint145-paddle-billing-ui.test.mjs)
- [tests/sprint153-paddle-checkout-json.test.mjs](tests/sprint153-paddle-checkout-json.test.mjs)
- [tests/sprint233-commercial-lifecycle.test.mjs](tests/sprint233-commercial-lifecycle.test.mjs)

## Provider references

Implementation was checked against the official [transaction checkout documentation](https://developer.paddle.com/build/transactions/pass-transaction-checkout/), [checkout success handling](https://developer.paddle.com/build/checkout/handle-success-post-checkout/), [payment-method updates](https://developer.paddle.com/build/subscriptions/update-payment-details/) and [SDK callback updates](https://developer.paddle.com/paddle-js/methods/paddle-update/). These documents establish the integration contract, not evidence of a successful VAYON payment.
