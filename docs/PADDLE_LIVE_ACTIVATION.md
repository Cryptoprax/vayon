# Paddle Live Activation

VAYON uses one server-owned Paddle Billing integration. Live and sandbox catalogs, customers, subscriptions, prices, discounts, and webhook destinations are separate.

## Required live configuration

- Set `PADDLE_ENVIRONMENT=live`.
- Store a live `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, and the eight live product/price mappings in the production secret manager.
- Pin `PADDLE_API_VERSION=1` and configure an approved Paddle payment-link domain.
- Configure monthly and annual recurring prices, including any Paddle-managed trial period, tax category, and eligible discounts or coupons.
- Subscribe the live webhook destination to `transaction.completed`, `transaction.paid`, `transaction.payment_failed`, `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.trialing`, `subscription.activated`, and `subscription.past_due`.

Never copy sandbox IDs, customers, or credentials into live configuration. VAYON rejects a detectable sandbox/live API-key mismatch and never trusts client-side subscription state.

## Activation evidence

Before launch, run `npm run audit:paddle-live`, call the server-side live readiness service, complete monthly and annual checkouts with Paddle test-mode controls available to the live account, open the customer portal, and replay signed webhook simulations. Confirm the existing subscription, invoice, billing-event, entitlement, and organization-limit projections before enabling paid traffic.
