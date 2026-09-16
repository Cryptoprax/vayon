# Sprint 237 — Professional Founding Member billing

Implemented locally for review. No commit, push, deployment, production SQL, migration-history repair, Paddle configuration change, or Vercel variable change was performed. The existing Paddle overlay and its public client-side token were retained, as explicitly confirmed during this session. Server credentials and configured price IDs are not included in browser props or checkout responses.

1. **Architecture.** The existing Paddle provider, checkout service, verified webhook route, Supabase service client, subscription projection, and entitlement tables remain authoritative. `FoundingMemberService` coordinates an organization-level promotion; it does not create another subscription or entitlement system. An organization with an existing provider subscription is not newly eligible, including a previously canceled paid organization. The allocation follows the organization across workspaces; the purchased subscription continues to use the existing workspace billing model.

2. **Database changes.** `professional_founding_allocations` records organization/workspace, reservation UUID, slot, status, allocation/reservation/confirmation timestamps, authoritative promotional boundaries, successful-period count, Paddle customer/initial transaction/subscription identifiers, server-only founding/standard price snapshots, transition timestamp, and a short mutation lease. `professional_founding_periods` records successful transaction IDs and Paddle period boundaries. `paddle_subscription_projection_versions` records the last provider update timestamp per workspace. All three tables have RLS enabled; allocation data is unavailable to anonymous/authenticated database roles. RPCs are service-role-only. There is no stored card, bank, or sensitive payment information.

3. **Concurrency guarantee.** Allocation and release take `pg_advisory_xact_lock(237,20)`. The organization primary key prevents multiple allocations across workspaces. The slot has both a unique constraint and a `1..20` check. Confirmed and ended allocations retain their slots permanently; only an unconfirmed reservation can release its slot. Thus there cannot be a twenty-first simultaneous reservation/confirmed allocation, even if application requests race. A real two-connection PostgreSQL test verified contention for slot 20.

4. **Reservation semantics.** Reading pricing never writes inventory. Checkout first creates a standard-price Paddle transaction. The server then atomically validates eligibility and records that transaction in a 30-minute reservation. Only after persistence does it PATCH that transaction to the founding price and add server-written organization/workspace/plan/period/reservation custom data. Concurrent requests from the same organization cannot obtain another reservation. A second request that loses this race can leave an unreturned standard-price transaction, but no additional founding slot or discounted transaction.

5. **Confirmation semantics.** Signature verification precedes all webhook processing. The server retrieves current Paddle state and the database confirms only a completed, positive-value, non-prorated monthly founding-price payment with matching customer and initial-transaction/subscription binding. A flag in custom data alone cannot confirm an allocation. Transaction IDs and period boundaries independently prevent duplicate counting. A founding subscription event arriving before payment confirmation is retried instead of granting paid access.

6. **Abandoned and failed checkout.** Creation failure occurs before reservation. An ambiguous price PATCH failure attempts cancellation; its durable transaction binding allows later recovery. At/after the 30-minute threshold, the scheduled worker retrieves Paddle state and cancels unpaid transactions before releasing inventory. Under normal operation, cleanup runs within the next 15-minute schedule interval. A `paid` transaction still being processed retains its slot. A completed founding payment confirms ownership even if its webhook was delayed. An immutable completed standard-price transaction releases its unused founding reservation. Cancellation errors retain the reservation and produce retryable reconciliation failure; time alone never makes an old discounted checkout reusable after releasing its slot.

7. **Monthly selection.** Standard `PADDLE_PRICE_PROFESSIONAL_MONTHLY` remains the $149 mapping. Eligible Professional monthly checkout with valid optional configuration reserves a slot and uses `PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY`. Ineligible, exhausted, or unconfigured offers use the standard mapping. The checkout API rejects extra browser fields, including price IDs, promotion flags, discount values, and slot numbers. Starter, Business, Business Plus, and existing quantity semantics remain unchanged. Updating an existing founding subscription while retaining Professional monthly preserves its founding price before the twelfth payment.

8. **Annual pricing.** Professional annual always uses the existing standard annual Paddle mapping. There is no founding annual price. The UI shows $1,430.40 billed annually and the exact $119.20 monthly equivalent; the prior rounded $119 equivalent was corrected to preserve the specified 20% discount. Monthly standard prices remain Starter $79, Professional $149, Business $399, Business Plus $799.

9. **Twelve-period transition.** Paddle API version 1 does not accept an arbitrary future item-price change through `scheduled_change`. After the twelfth successful monthly period, the allocation becomes `transition_pending`. The service reads current subscription items, replaces only the founding price with the stored standard monthly price, preserves item quantities and other items, and uses `proration_billing_mode: "do_not_bill"`. It does not change the next billing date or charge again for the twelfth period; the next renewal uses standard pricing. A successful update is recorded as `transitioned`. Retries first inspect current items, making an already-applied update harmless. The provider supports this mode for paused subscriptions as well. See [Paddle subscription update](https://developer.paddle.com/api-reference/subscriptions/update-subscription/) and [paused-subscription proration](https://developer.paddle.com/errors/subscriptions/subscription_incorrect_proration_on_paused_subscription/).

10. **Clock and lifecycle behavior.** This is twelve successful paid monthly periods, not twelve calendar months from checkout. Paddle supplies the start/end boundaries; there is no JavaScript month arithmetic. Promotional start is the earliest counted boundary; a definitive end is recorded once twelve periods exist. Failed/past-due collections and pauses do not increment the count. Full paid periods on resume count, including a new full period whose dates overlap the pre-pause period; prorations do not. Existing transaction/period duplicates cannot increment it. Paid periods remain counted after a later refund; cancellation/plan departure forfeits unused promotional periods and never resets eligibility. Cancellation at period end preserves current access through Paddle's normal lifecycle. The same paused subscription can resume with its remaining periods; a pending standard-price transition is completed before VAYON initiates resume. A new subscription after cancellation uses standard pricing. The ledger keeps additional anomalous paid periods for observability and always derives the commercial boundary from the earliest twelve.

11. **Webhook and mutation safety.** The existing HMAC/timestamp verification remains. The existing billing-event projection is reused through a wrapper with workspace locking and provider `updated_at` watermarks. Current provider state, rather than an old notification's status, drives subscription projection. Duplicate snapshots are ignored; older subscriptions cannot overwrite a newer active workspace subscription. Payments update invoices, not subscription access, so a delayed successful payment cannot revive a canceled subscription. A two-minute database lease serializes founding price transitions with application plan changes; interrupted leases expire. This is an application lease, not a distributed transaction with Paddle.

12. **Public pricing.** `/pricing` obtains uncached global server availability at request time. The public availability endpoint returns only a boolean and uses `Cache-Control: no-store`. Pricing and the homepage banner refresh every 30 seconds and fail closed on errors. The offer identifies the first 20 *eligible* agencies and says eligibility is confirmed at checkout. Sold-out/default states display standard prices and remove the founding claim. A page already open can be up to one refresh interval stale; checkout independently revalidates, and Paddle presents the actual payable price.

13. **Subscription Center.** The server supplies organization eligibility and existing ownership; authenticated refreshes re-check the current workspace context. Monthly $149 strike-through/$79 presentation appears only for server eligibility or an applicable reservation/subscription. Sold-out non-owners see $149. Existing owners see paid-period progress and the authoritative end date once known, even when inventory is exhausted. Annual selection is always standard. Provider catalog identifiers are stripped before client component props. Browser checkout completion still only polls/refreshes; it does not grant access.

14. **Configuration/readiness.** New optional server configuration: `PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY`. New scheduled-worker authentication configuration: `CRON_SECRET`. No real price ID was added. Missing/invalid founding price, an identical standard/founding mapping, or missing cron authentication prevents new promotional availability/reservations while preserving standard checkout. Readiness reports the optional offer separately. Stored confirmed allocations can still reconcile using their price snapshots when the optional price variable is absent. Existing API key/webhook secret handling and explicit Sandbox environment behavior are unchanged.

15. **Exact files changed.** The file inventory below includes implementation, migration, tests, configuration, and this report. Two older presentation tests were updated for the intentional server-availability component/prop changes; their previous static-marketing assertions no longer represented the requested behavior.

16. **Exact migration filename.** `supabase/migrations/20261031000000_sprint237_professional_founding.sql`.

17. **Exact SQL for later manual application.** The complete, executable SQL is the [migration file](../supabase/migrations/20261031000000_sprint237_professional_founding.sql), from its `begin;` through `commit;`; no additional SQL is required by this implementation. It creates the three tables, eligibility/reservation/release/payment/lease functions, a paid-founding trial-protection trigger, the existing billing projection body with invoice-only payment handling, and its ordered wrapper. It assumes the existing billing schema and Sprint 143 Paddle projection are present. Review against actual production schema before manual application. Do not use `supabase db push`, repair history, or re-run the one-time migration after it has succeeded. It was executed only against an isolated local PostgreSQL 18.4 test database.

18. **Tests.** Final selected regression run: **196 tests, 195 passed, 1 pre-existing failure, 0 skipped**. This includes **59 new Sprint 237 tests: 28 checkout/configuration/security/display tests and 31 actual PostgreSQL lifecycle/concurrency tests, all passing**. The regression selection includes all billing/Paddle/pricing/subscription/trial/commercial test files and every test file mentioning entitlements, including Sprint 236 environment/diagnostic/provider/checkout coverage, Paddle webhooks, and VAYON3DAY. Local integration tests use only `127.0.0.1` and a disposable database; they never consume a production connection string. To reproduce the new database tests, supply `SPRINT237_POSTGRES_PORT` for a disposable local PostgreSQL server and run `node --test tests/sprint237-*.test.mjs`. Without that variable, the database suite explicitly skips.

19. **TypeScript.** `npm.cmd run typecheck` passed with no errors.

20. **ESLint.** `npm.cmd run lint` passed with zero errors and zero warnings.

21. **Production build.** `npm.cmd run build` passed. An existing build-time OpenAI health probe reported exhausted credits/HTTP 429; it did not fail the build and is unrelated to billing. No OpenAI configuration was changed.

22. **Whitespace validation.** `git diff --check` passed. Git reported its existing Windows LF-to-CRLF normalization notices; these are not whitespace-check failures.

23. **Existing unrelated failure.** `tests/sprint233-commercial-lifecycle.test.mjs:8`, “trial changes days at exact 24-hour boundaries and expires at 72 hours.” It expects `{ day: 1 }` without `totalDays`; the unchanged current trial function returns `{ day: null, totalDays: null }` when no trial start/source is supplied. The same result was reproduced by loading the trial implementation directly from `git show HEAD:features/vayon/billing/config/trial.ts`. Neither that implementation nor that test was modified.

24. **Manual steps and practical limits.** After review, manually apply the exact migration; set the new founding price variable in the intended Paddle environment; configure `CRON_SECRET`; and deploy separately with the existing Sandbox configuration preserved. Ensure the Vercel plan supports the included `*/15 * * * *` schedule and that `/api/billing/paddle/founding/reconcile` runs successfully. Retain transaction/subscription webhook notifications, and verify API permissions for reading/updating transactions and subscriptions. Confirm in Sandbox that the new price is active, USD $79, monthly, on the existing Professional product, with no trial, and that standard Professional remains $149 monthly/$1,430.40 annual. Exercise payment, abandonment cancellation, pause/resume, and a twelfth-payment transition against Paddle before launch. Real Paddle payment/API mutations were not executed in this session.

    The promotion depends on webhook processing or scheduled recovery completing before the following renewal. A prolonged outage of both paths can let Paddle renew at the old price; there is no provider-native twelve-cycle price schedule to eliminate that dependency. Such excess payments are retained/detected and logged as `billing.founding_offer.excess_payment_detected`, not silently treated as extra promotional entitlement. They require operational billing review; this implementation does not issue automatic retroactive charges/refunds. API failures retain inventory conservatively until Paddle confirms a safe terminal state. Allocations are scoped to the Supabase database, so Sandbox testing should use isolated data; changing environment variables does not reset confirmed slots.

    VAYON3DAY's code, duration, uniqueness rules, and original RPC remain intact. The added database guard prevents a confirmed founding organization's paid subscription from being overwritten by trial redemption, including paused/past-due states. The actual existing redemption RPC was exercised locally to verify rollback without consuming a redemption.

**File inventory**

```text
.env.example
app/(marketing)/pricing/page.tsx
app/api/billing/paddle/checkout/route.ts
app/api/billing/paddle/founding/availability/route.ts
app/api/billing/paddle/founding/reconcile/route.ts
app/vayon/settings/billing/page.tsx
docs/sprint237-founding-billing-review.md
features/marketing/components/FoundingOffer.tsx
features/marketing/components/Homepage.tsx
features/marketing/components/MarketingPage.tsx
features/marketing/components/PricingTable.tsx
features/platform/commercial-pricing.ts
features/vayon/billing/actions/subscription-center.actions.ts
features/vayon/billing/components/CommercialPlatform.tsx
features/vayon/billing/components/SubscriptionCenter.tsx
features/vayon/billing/components/SubscriptionManagement.tsx
features/vayon/billing/providers/paddle/paddle-catalog.ts
features/vayon/billing/providers/paddle/paddle-catalog.types.ts
features/vayon/billing/providers/paddle/paddle.provider.ts
features/vayon/billing/services/founding-member.service.ts
features/vayon/billing/services/founding-member.types.ts
features/vayon/billing/services/paddle-checkout.service.ts
features/vayon/billing/services/paddle-live-readiness.service.ts
features/vayon/billing/services/paddle-webhook.service.ts
supabase/migrations/20261031000000_sprint237_professional_founding.sql
tests/helpers/sprint237-database.mjs
tests/helpers/sprint237-load.mjs
tests/sprint140-premium-pricing-experience.test.mjs
tests/sprint210-homepage-commercial-optimization.test.mjs
tests/sprint237-founding-checkout.test.mjs
tests/sprint237-founding-database.test.mjs
vercel.json
```
