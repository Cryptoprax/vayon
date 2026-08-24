# Stripe Billing Lifecycle

## Architecture

Stripe is the commercial source of subscription state. VAYON creates Checkout, Portal, plan-change, cancellation, and resume requests only on the server. Local subscription state is never changed optimistically: signed Stripe webhooks project confirmed state into tenant-scoped billing tables. The existing entitlement engine reads that projected plan and status and remains the sole feature/quota authority.

## Webhook flow

1. Stripe posts the raw request body to `/api/webhooks/stripe`.
2. `StripeBillingProvider` verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`.
3. `process_stripe_billing_event` records the provider event using the unique `(provider, provider_event_id)` identity.
4. Duplicate events return without mutation.
5. Organization/workspace identity is resolved from signed Stripe metadata or the existing billing-customer link.
6. Subscription, plan, items, limits, invoices, and payment state are projected atomically.
7. Optional notification email failures are logged but do not cause Stripe to retry an already-processed commercial event.

Invalid signatures return HTTP 400. Transient projection failures return HTTP 500 so Stripe retries.

## Subscription lifecycle

- Checkout provisions a new subscription with organization, workspace, and plan metadata.
- `created` and `updated` events synchronize plan, seats, period, trial, price, quotas, and state.
- Upgrades/downgrades use Stripe proration and become effective locally only after webhook confirmation.
- Cancellation and resume set `cancel_at_period_end` through Stripe and wait for confirmation.
- Deleted subscriptions become `cancelled`; `incomplete_expired` becomes `expired`; Stripe pause becomes `paused`.
- Failed invoices move the subscription to `past_due`; a later paid invoice restores it to `active`.
- Finalized/paid/failed invoices are idempotently projected into invoice history with hosted receipt URLs.

## Failure recovery

- Signature failures are rejected and never processed.
- Unknown plans, missing tenant metadata, and unprovisioned workspaces fail closed.
- Database failures return HTTP 500 for Stripe retry.
- Event identity prevents duplicate side effects during retries.
- Operators inspect `billing_events`, Stripe webhook delivery history, provider health, and sanitized structured logs before replaying an event from Stripe.

## Operational runbook

1. Configure Stripe products/prices for Starter, Professional, Business, and Enterprise and set the existing `STRIPE_PRICE_<PLAN>` variables.
2. Configure the Customer Portal to allow payment-method updates, invoice history, cancellations, and permitted plan changes.
3. Register the production webhook URL and the eight certified lifecycle events.
4. Apply the Sprint 123 migration through the normal reviewed migration process.
5. Test Checkout in Stripe test mode; confirm customer, subscription, item, limits, and invoice projections.
6. Test upgrade, downgrade, cancellation, resume, failed payment, recovery, and duplicate webhook delivery.
7. Confirm Founder billing KPIs use measured repository data or display unavailable states when RLS/evidence prevents aggregation.

Never expose Stripe secrets, replay events without confirming their event ID, or manually update subscription state to bypass webhook reconciliation.
