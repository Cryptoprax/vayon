# Immutable checkpoint: 2026-09-18

Snapshot of the completed audit; do not overwrite.

# VAYON current project state

Audit date: 2026-09-18 (Asia/Calcutta). Evidence baseline: d14db92cd50813650f16e2d1d465b1648a93387b.
This is a checkpoint, not permission to mutate production. Recheck live state before future action.
Evidence labels: **Verified** = current read-only observation or repository source; **Prior validation** = tool results in this working conversation; **Reported** = operator-provided dashboard state; **Unverified** = inaccessible to this audit.

## 1. Project identity and Git

- Repository: https://github.com/Cryptoprax/vayon.git
- Workspace: C:\Users\Prakyath's Asus\leadestateai
- Branch: main.
- HEAD and freshly queried GitHub origin/main: d14db92cd50813650f16e2d1d465b1648a93387b.
- Commit: fix(billing): correct Paddle subscription item projection.
- Local tracking comparison: 0 ahead / 0 behind. Clean working tree at audit start.
- Expected auth, diagnostics and projection commits exist in history. The fix commit changes only its new migration and two database test files.
- Other branches: commercial-v1 (4ad691c; old Sprint 70), rebrand (fd7952a; Release 3.0); origin/commercial-v1 also exists. No stashes. No evidence these are abandoned copies of the current billing fix; do not delete/merge them speculatively.
- Last 30 commits were reviewed; recorded in the appendix below.
- Only checkpoint documentation is authorized to be newly uncommitted after this audit.

## 2. Production deployment and account boundaries

- Canonical domain: https://www.vayon.online.
- Vercel team/project: realestatewhatsapp/vayon.
- **Verified:** GitHub's Vercel status and Production deployment status both report successful completion for d14db92cd50813650f16e2d1d465b1648a93387b.
- Deployment dashboard: https://vercel.com/realestatewhatsapp/vayon/5raDL7vTt68An5Y7QD8iLPHoGiWx
- Vercel production metadata API access returned 403. Current environment-variable presence, values, account plan and domain alias configuration could not be independently checked there.
- Supabase project name: vayon-production (**Reported**). The already-configured database connection successfully exposed founding/promo schema and the scoped test organization. The management project display name was not independently available.
- Paddle environment is intentionally SANDBOX (**Reported**). Repository provider code explicitly supports sandbox in production; no NODE_ENV-to-live assumption. Current deployed variable value and Paddle dashboard configuration were not independently verified.
- Moving ChatGPT accounts does not change these Git/deployment records. This audit cannot verify transfer of chat history or external account permissions.

## 3. Architecture map and completed work

| Area | Current implementation / evidence |
|---|---|
| Sprint 236 | Four self-service plans; catalog-driven Paddle checkout; explicit sandbox/live validation; checkout diagnostics; legacy provider constraint compatibility; VAYON3DAY; trial/entitlement presentation |
| Pricing | features/platform/commercial-pricing.ts; billing/config/entitlements.ts; providers/paddle/paddle-catalog.ts |
| Subscription UI | features/vayon/billing/components/CommercialPlatform.tsx; checkout-overlay.ts; subscription-center.actions.ts; subscription.repository.ts |
| Checkout | app/api/billing/paddle/checkout/route.ts -> PaddleCheckoutService -> server-side catalog/customer/provider -> founding reservation and price application |
| Sprint 237 | FoundingMemberService; organization allocation and payment ledger; first-20 reservation locks; twelve-paid-period transition; webhook recovery; authenticated reconciliation |
| Reconciliation | app/api/billing/paddle/founding/reconcile/route.ts -> FoundingMemberService.reconcile() |
| Webhooks | app/api/webhooks/paddle/route.ts -> PaddleWebhookService -> signature verification -> founding processing -> PaddleSubscriptionSyncService.project() |
| Database projection | process_paddle_billing_event -> private process_paddle_billing_event_core237 -> subscription, items, limits, billing events, version record |
| Authentication | features/authentication/components/SignupForm.tsx; app/auth/callback/route.ts; authentication/security/oauth.ts |
| Documentation | docs/sprint237-founding-billing-review.md; PADDLE_BILLING_PLATFORM.md; COMMERCIAL_LIFECYCLE_CERTIFICATION.md; this checkpoint |
| Tests | Sprint 236 suites; Sprint 237 checkout/database/scheduler/diagnostics; auth-callback-diagnostics and signup-confirmation tests |

## 4. Founding billing invariants

Verified from service, checkout, pricing and Sprint 237 SQL:

- First 20 eligible organizations: allocation primary key is organization_id; slot is unique and constrained to 1..20.
- Reservation uses pg_advisory_xact_lock(237,20), persisted provider transaction binding and a 30-minute reservation threshold.
- Time alone does not release a payable transaction. Reconciliation checks provider state before release; paid-but-processing retains the slot.
- Server chooses catalog prices. Browser selects plan/period, not a trusted price or slot. Catalog modules are server-only.
- Professional founding monthly presentation is $79; standard Professional monthly is $149.
- Exactly twelve qualifying successful paid monthly periods, derived from deduplicated professional_founding_periods, lead to transition_pending and standard-price transition.
- Payment validation checks provider customer, subscription, price, recurring interval, positive totals, origins and authoritative period boundaries; prorations do not count.
- Transition changes renewal items without billing immediately and preserves quantities; it does not manufacture an extra payment.
- Professional annual stays on standard annual pricing; no founding allocation/discount application for annual checkout.
- Founding ownership is organization-wide, not a browser/user/workspace-local promotion.
- Monetary amounts of configured external Paddle catalog objects were not read; repository intent is verified, external catalog values remain unverified.
- Do not interpret a browser checkout.completed notification as proof of persisted workspace activation.

## 5. Pricing

| Plan | Standard monthly display |
|---|---|
| Starter | $79 |
| Professional | $149 |
| Professional Founding | $79, first 20 eligible organizations, twelve successful paid monthly periods |
| Business | $399 |
| Business Plus | $799 |
| Enterprise | Contact/custom; excluded from self-service checkout |

Annual presentation uses standard monthly price with 20% savings. Founding applies only to eligible Professional monthly subscriptions.

## 6. Scheduler

Verified .github/workflows/founding-reconciliation.yml:
- schedule: 7,22,37,52 * * * * (UTC); manual workflow_dispatch enabled.
- Target: https://www.vayon.online/api/billing/paddle/founding/reconcile.
- Restricted to Cryptoprax/vayon and refs/heads/main.
- permissions: contents: read.
- concurrency group vayon-founding-reconciliation; cancel-in-progress: false.
- Seven-minute job timeout; curl connect timeout 15 seconds and maximum request 330 seconds.
- HTTPS only; redirects not followed; no automatic immediate curl retries.
- Authorization supplied through stdin header handling; response body never printed; sanitized HTTP failures and JSON ok=true validation.
- GitHub secret name VAYON_RECONCILIATION_SECRET; server secret name CRON_SECRET.
- Secret-list access returned 401. Presence/equality was not independently verified; values were neither requested nor printed.
- vercel.json has no crons property. The repository no longer depends on unsupported high-frequency Hobby cron. Actual current Vercel plan is unverified.
- Scheduler execution is best-effort, not a guaranteed fifteen-minute completion SLA.

Recent observed runs (UTC):
| Run | Started | Conclusion |
|---|---|---|
| 10 | 2026-09-17 19:41:41 | failure |
| 9 | 2026-09-17 17:11:24 | failure |
| 8 | 2026-09-17 17:00:56 | failure |
| 7 | 2026-09-17 15:53:54 | success |
| 6 | 2026-09-17 11:51:45 | success |

Run 10 started at 2026-09-18 01:11:41 IST. Scheduler exists and executes, but reconciliation is NOT currently healthy. This audit did not trigger it.

## 7. Webhook architecture

Expected canonical destination: https://www.vayon.online/api/webhooks/paddle.
Dashboard Active state and selected subscriptions are unverified.

Code supports transaction.completed, transaction.payment_failed, subscription.created, subscription.updated, subscription.past_due, subscription.paused, subscription.resumed, subscription.canceled; also transaction.paid, subscription.activated, subscription.trialing, customer.updated and legacy payment aliases.

Raw-body HMAC verification and timestamp checks precede provider-state refresh/founding processing and projection. Missing/invalid signatures return 400; other errors return 500.
Founding recording and subscription projection are separate RPCs: the first can commit while the second fails.
The earlier webhook 500 is plausibly related to projection, but no matched SQLSTATE/category established a shared cause. Do not report this as confirmed.
No payloads, signatures, customer/provider identifiers or secrets are retained here.

## 8. Migration ledger (repository chronology)

All listed files are committed. Production application is not established merely by presence in Git.

| File under supabase/migrations/ | Purpose | Production evidence | Rerun / pending |
|---|---|---|---|
| 20261030000000_sprint233_workspace_trial.sql | Earlier workspace trial provisioning | Not freshly verified | Superseded by later provisioning; do not replay out of order |
| 20261030010000_sprint233_trial_enforcement.sql | Commercial write policy and guards | Not freshly verified | Review complete migration and installed state first; no rerun authorized |
| 20261030020000_sprint236_paddle_provider_compatibility.sql | Expands only legacy Stripe/Razorpay billing-customer check to include Paddle | Existing Paddle customer mapping supports compatibility, not exact migration-history proof | Designed to no-op when legacy check absent; no application requested |
| 20261030030000_sprint236_vayon3day_redemption.sql | Explicit one-time three-day promo and no automatic new-workspace trial | Promo schema visible; full deployed body/history unverified | Uses IF NOT EXISTS/CREATE OR REPLACE, but replay can overwrite newer functions; do not replay casually |
| 20261031000000_sprint237_professional_founding.sql | Allocations, period ledger, locks, paid-trial protection, ordered projection | Founding schema and confirmed ledger visible; operator reports manual application | One-time CREATE statements; NOT safe to blindly rerun; never reapply |
| 20261031010000_fix_paddle_subscription_item_projection.sql | Correct item identity in private projection core | Committed/deployed code; operator reports NOT applied; direct installed function/history unavailable | Transactional CREATE OR REPLACE + restricted privileges; isolated rerun passed; treat as pending until read-only installed-definition review confirms |

The old founding migration remains unchanged by d14db92. Do not repair migration history or run supabase db push.

## 9. Current scoped customer test state

Fresh read-only lookup: PRAKYATH VP Organization and only the workspace bound to its existing allocation.

- Allocation: confirmed; successful_periods: 1.
- Transaction/customer/subscription/founding-price/standard-price references: all present.
- Workspace: Starter, trialing, provider inactive.
- Workspace Paddle customer linkage: no; Paddle subscription linkage: no.
- Period end/renewal: absent.
- Subscription projection/version record: absent.
- Invoice: absent; relevant scoped billing events: absent.
- Production API schema marks subscription_items.provider_item_id required.
- This account is not yet verified as activated paid Professional.
- DO NOT retry checkout or create another payment. Recover the existing recorded payment/subscription.

These observations do not prove whether the new function definition is installed: a migration can be applied without successful reconciliation. Direct function-definition or migration-history read remains necessary to conclusively verify pending status.

## 10. Known defect and validated fix

Operator-supplied production logs for run 9:
- 2026-09-17T17:11:30.622Z billing.founding_offer.confirmed; successfulPeriods=1.
- 2026-09-17T17:11:31.899Z billing.founding_offer.reconciliation_failed; subscription_sync; DatabaseError; SQLSTATE 23502.

Old SQL maps item->>'id' into NOT NULL subscription_items.provider_item_id. Paddle-shaped subscription items contain price.id and no item-level id.
Production required-column metadata, SQL data flow and test fixture review strongly support this cause; the production error's table/column fields were not directly available.

New core function generates paddle:<subscription-id>:<price-id>. It validates string identities with sub_/pri_ prefixes and nonempty lowercase alphanumeric suffixes, excluding separators. Missing/malformed identities raise 22023 and roll back the RPC.
NOT NULL and uniqueness are preserved; different subscriptions sharing a price cannot collide. No random key or price-only key is used.
Function SECURITY DEFINER/search_path=public and private-core revokes remain; service_role enters through the existing public wrapper.
Only the core function is replaced, not payment/checkout/status/plan/entitlement/transition logic.

Reconciliation for confirmed successful_periods=1 does not skip synchronization: transaction list -> recordPayment -> subscription fetch/validation -> syncSubscription (another fetch) -> project -> RPC.
The diagnostics subscription_sync stage includes that second fetch and projection; it cannot alone distinguish them, but DatabaseError/23502 points to the database RPC.
Confirmed-allocation reconciliation does NOT project transaction invoices. First-payment invoice recovery is separate.

## 11. VAYON3DAY

Verified SQL: authenticated, role-checked, server-authoritative three-day redemption. Unique controls cover code+user, code+organization and code+workspace. Existing paid/trial-use checks prevent inappropriate reuse. No Paddle object creation.
Sprint 237 paid-founding protection prevents trial overwrite, including paused/past-due cases covered by tests.
Do not combine or replace this promo with founding billing.

## 12. Authentication and email

Verified:
- Signup confirmation screen: Check your email; OK, go to Sign In.
- UI asks for email confirmation before sign-in and suggests the signup browser.
- Callback performs existing PKCE exchange; structured diagnostics permit known categories and cookie/code presence only.
- Exact safer error: We couldn't complete sign-in from this link. If you've already confirmed your email, sign in with your password.
- trustedApplicationOrigin uses NEXT_PUBLIC_APP_URL; no auth redesign is needed.

Reported, NOT independently verified against management dashboards:
- Supabase requires email confirmation.
- Site URL/allowed redirects use canonical www.
- Confirm-signup template uses {{ .ConfirmationURL }}.
- Resend custom SMTP/domain verification and VAYON sender configuration are complete. Sender address deliberately omitted from checkpoint.

Email confirmation may succeed while automatic PKCE session exchange fails. Do not reset email confirmation or redesign token_hash/PKCE based solely on session-exchange failure.

## 13. Environment variable names (no values)

Repository expectations, not a production presence audit:
- PADDLE_ENVIRONMENT, PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET.
- PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY.
- PADDLE_PRODUCT_STARTER/PROFESSIONAL/BUSINESS/BUSINESS_PLUS.
- PADDLE_PRICE_STARTER_MONTHLY/ANNUAL, PADDLE_PRICE_PROFESSIONAL_MONTHLY/ANNUAL, PADDLE_PRICE_BUSINESS_MONTHLY/ANNUAL, PADDLE_PRICE_BUSINESS_PLUS_MONTHLY/ANNUAL.
- CRON_SECRET; GitHub VAYON_RECONCILIATION_SECRET.
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
- NEXT_PUBLIC_APP_URL; optional provider version/timeout settings and client token configuration.
Vercel metadata denied access. Local env contents must not be treated as proof of deployed configuration.

## 14. Tests and CI evidence

**Prior validation in this working conversation at the unchanged fix:**
- PostgreSQL 18.4 Docker, loopback 127.0.0.1:55437, disposable databases; 45 passed, 0 failed, 0 skipped.
- Relevant billing/founding selection with DB enabled: 163 passed, 0 failed, 0 skipped.
- Migration execution/rerun, real production-shaped items, NOT NULL/unique, idempotency, collision safety, invalid-identity atomic rollback, confirmed-payment recovery, webhook projection and permissions passed.
- Read-only local catalog inspection confirmed SECURITY DEFINER, search_path, ownership and private/public role privileges.
- Container and disposable DBs removed afterward. These tests were not rerun during this read-only audit.
- TypeScript, ESLint and production build passed before commit. Build emitted an unrelated OpenAI health insufficient-quota diagnostic.
- Current git diff --check passed before documentation; checked again afterward.

Relevant files: tests/sprint237-founding-{checkout,database,scheduler,diagnostics}.test.mjs; tests/helpers/sprint237-database.mjs; Sprint 236 pricing/environment/provider/checkout/VAYON3DAY tests; auth-callback-diagnostics.test.mjs; signup-confirmation.test.mjs.

DB tests explicitly skip without SPRINT237_POSTGRES_PORT. The helper hardcodes 127.0.0.1, creates disposable databases and ignores production connection strings.
GitHub CI has no configured PostgreSQL service/SPRINT237_POSTGRES_PORT, so DB integration coverage is not exercised there.

**Fresh CI observation:** validate for d14db92 FAILED at Run npm test. Vercel deployment nevertheless succeeded.
Repository docs separately record an older unrelated failure: tests/sprint233-commercial-lifecycle.test.mjs:8, trial changes days at exact 24-hour boundaries and expires at 72 hours. Expected day/totalDays shape disagrees with unchanged no-trial-input behavior.
Do not assume that historical failure is the sole cause of current CI failure without logs. Historical report 196 total / 195 pass / 1 fail refers to a different selection; it is not interchangeable with 163/163.

## 15. Security review

A value-suppressing scan of 3,670 tracked files found no matching private-key blocks, JWTs, recognized long credential tokens, real-format Paddle price IDs, or tracked non-example environment files.
Inspected sensitive paths use environment lookups; new auth/reconciliation failure diagnostics restrict metadata.
This is a targeted scan, not proof that all possible secrets are absent and not a full Git-history secret scan. Secret values were never printed.
Existing broader billing logs still include internal correlation/provider identifiers in some success paths; do not export raw logs. This is a logging-minimization consideration, not discovery of a tracked credential.
No application changes were made for audit findings. If future review finds a possible secret, report only file and variable name and stop.

## 16. Blockers and next action

- Workspace paid access remains unprojected; scheduler runs fail.
- Production application of the new migration remains reported pending, not conclusively verifiable through available function/history access.
- GitHub CI failed at npm test; full current failure detail unverified.
- Vercel environment, Paddle dashboard, Supabase auth/SMTP settings inaccessible for independent verification.

**Single next production action:** manually review the installed core-function definition/migration state and, only if still unapplied, manually apply the reviewed 20261031010000_fix_paddle_subscription_item_projection.sql through the approved production process. This audit grants no execution permission.
After that separately authorized step: one controlled reconciliation and read-only verification of the existing payment/subscription; handle invoice recovery separately. Do not create another checkout.

## 17. DO NOT REDO

- Do not create another founding checkout/payment for the existing test organization.
- Do not reapply the one-time Sprint 237 founding migration or rewrite historical migrations.
- Do not run supabase db push or repair migration history without explicit approval.
- Do not recreate the founding Paddle price or reconciliation secrets based on lost chat context; inspect existing configuration.
- Do not switch Sandbox to Live.
- Do not change canonical www Site URL/destinations back to apex.
- Do not reintroduce high-frequency Vercel Cron.
- Do not manually edit successful_periods, allocation state or workspace plan to force access.
- Do not reimplement the already committed item-key fix or diagnostic/auth changes.
- Do not claim deployment applies SQL, or invoice recovery follows automatically from subscription reconciliation.
- Do not replay webhooks, rerun workflows, rotate secrets or deploy as an audit step.

## 18. Recovery instructions

If context is lost:
1. Read docs/VAYON_CURRENT_PROJECT_STATE.md.
2. Read latest file under docs/checkpoints/.
3. Run git status.
4. Run git log --oneline -20.
5. Confirm origin/main.
6. Confirm Vercel Production commit.
7. Never run supabase db push before reviewing production migration history.
8. Do not create another founding checkout for the existing test organization.
9. Check pending production migration state before doing anything else.

Keep the timestamped checkpoint immutable. Update the current-state document only after verifying new evidence. No secrets, provider IDs, organization/workspace UUIDs or customer emails belong in either document.

## 19. Important commits and last-30 history

Full SHAs for recovery:
- d14db92cd50813650f16e2d1d465b1648a93387b: projection fix.
- 88f0405e1da53044989bfdcb4eb16bde879964b4: safe reconciliation diagnostics.
- a91f34f33c96da0dea2484cb32c9064728b39f2b: safe auth callback diagnostics.
- 1a86f1316ccb3085d9d8c73c7d59b022f0964656: email-confirmation signup UX.
- 73dcc3205e1fff155657e59865feec22f1364dc7: canonical reconciliation URL and diagnostics.
- c36222b1fef7bf27187d16acbaf0abef7440df58: GitHub scheduler.
- 2db52edf666e73ff596f436513e1c2a4681ecdf1: founding billing.

Last 30, newest first:
d14db92 projection fix; 88f0405 reconciliation diagnostics; a91f34f auth diagnostics; 1a86f13 signup confirmation; 73dcc32 canonical scheduler; c36222b GitHub scheduler; 2647314 deployment trigger; 2db52ed Sprint 237; bc43b05 transaction validation; 4dcf068 explicit Sandbox; 57dcce0 checkout diagnostics; f35ba25 plan selection; 4b53993 pricing/trial UX; 5f58a80 pricing/entitlements; d7aa6e1 Sprint 236/VAYON3DAY; 06b26e5 Sprints 232-235; 549375a assistant/trial banner; d2cbd84 commercial lifecycle; d36e703 marketing certification; ff2c9d5 workflow certification; 64a3138 workflow UX; 7491c84 property workflow; 775096d identity/beta certification; c883912 Product Bible v1; a5ae31b beta candidate; 93f8645 creative UX; 5aa3f1a onboarding polish; ca58f15 launch readiness; 48721a1 legacy home redirect; b3273b2 onboarding/property UX.

## 20. Audit boundary

Phase 1 was read-only. Phase 2 created documentation only. No code, tests, migrations, environment/configuration, production data, Paddle objects or Vercel state changed. No checkout, reconciliation, webhook replay, SQL application, database push, commit, push or deployment was initiated.

