# Sprint 143 — Paddle Billing Platform Integration

## Architecture

Paddle is the payment-side authority for checkout, subscriptions, invoices, tax calculation, and the hosted customer portal. VAYON remains authoritative for identities, organizations, workspaces, RBAC, permissions, internal subscription projections, entitlements, quotas, feature access, AI usage, and founder analytics.

The integration follows the existing billing boundary:

1. Authenticated billing managers create checkout or portal sessions server-side.
2. Paddle receives only validated catalog selections and tenant identifiers in `custom_data`.
3. Signed Paddle webhooks are projected idempotently into the existing billing tables.
4. The existing plan and `organization_limits` records continue to drive entitlements.
5. Existing founder analytics continue reading canonical subscription, invoice, and billing-event projections; no revenue values are fabricated.

Stripe code remains available for historical compatibility, but active subscription UI and lifecycle services now use Paddle.

## Environment Configuration

Required server-only configuration:

- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_ENVIRONMENT` (`sandbox` or production)
- `PADDLE_PRODUCT_STARTER`
- `PADDLE_PRODUCT_PROFESSIONAL`
- `PADDLE_PRODUCT_BUSINESS`
- `PADDLE_PRODUCT_BUSINESS_PLUS`
- Monthly and annual `PADDLE_PRICE_{PLAN}_{PERIOD}` values for each self-service plan

Enterprise has no Paddle price and remains Contact Sales only. Product and price IDs are never hardcoded.

## Security

- Checkout ownership is derived from the authenticated billing context and requires billing-management RBAC.
- Organization and workspace IDs are never accepted as client-controlled checkout inputs.
- Webhooks use the untouched raw request body and verify `Paddle-Signature` with HMAC-SHA256 and timing-safe comparison.
- Timestamp tolerance provides replay protection; event IDs provide database-level idempotency.
- Unknown signed events are stored as ignored without changing subscription state.
- API keys, webhook secrets, temporary portal URLs, and customer identifiers are not logged.

## Webhook Projection

Supported events include transaction completion, subscription creation/update/pause/resume/cancellation, payment success/failure, and customer updates. The projection stores Paddle customer, subscription, product, price, renewal, cancellation, and invoice identifiers using the existing canonical tables. Plan transitions refresh existing entitlement limits atomically.

## Customer Portal

The billing workspace creates temporary Paddle customer-portal sessions for subscription management, billing history, invoices, payment methods, cancellation, upgrades, and resume flows. Portal URLs are returned only to authenticated billing managers and are never cached.

## Operational Setup

1. Configure products and monthly/annual prices in Paddle.
2. Set every environment variable listed above.
3. Apply `20260922000000_sprint143_paddle_billing_platform.sql`.
4. Configure a Paddle notification destination for `/api/webhooks/paddle` and subscribe to the supported events.
5. Use Paddle's webhook simulator to validate sandbox lifecycle events.
6. Confirm checkout, portal, renewal, failure, cancellation, and duplicate delivery behavior before production enablement.

No deployment or database migration execution is performed by this sprint.
