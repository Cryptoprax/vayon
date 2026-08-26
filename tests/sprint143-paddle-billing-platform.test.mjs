import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const provider = read(
  "features/vayon/billing/providers/paddle/paddle.provider.ts",
);
const migration = read(
  "supabase/migrations/20260922000000_sprint143_paddle_billing_platform.sql",
);

test("Paddle billing architecture provides every required service and route", () => {
  for (const path of [
    "features/vayon/billing/services/paddle-checkout.service.ts",
    "features/vayon/billing/services/paddle-webhook.service.ts",
    "features/vayon/billing/services/paddle-subscription-sync.service.ts",
    "features/vayon/billing/services/paddle-customer.service.ts",
    "features/vayon/billing/services/paddle-catalog.service.ts",
    "features/vayon/billing/services/paddle-subscription.service.ts",
    "app/api/billing/paddle/checkout/route.ts",
    "app/api/billing/paddle/portal/route.ts",
    "app/api/webhooks/paddle/route.ts",
  ])
    assert.ok(existsSync(path), path);
});

test("checkout is server-owned and catalog IDs are environment-only", () => {
  const catalog = read(
    "features/vayon/billing/providers/paddle/paddle-catalog.ts",
  );
  const checkout = read(
    "features/vayon/billing/services/paddle-checkout.service.ts",
  );
  for (const plan of ["starter", "professional", "business", "business_plus"])
    assert.match(catalog, new RegExp(`"${plan}"`));
  for (const value of [
    "PADDLE_PRODUCT_",
    "PADDLE_PRICE_",
    "monthly",
    "annual",
    "organizationId",
    "workspaceId",
  ])
    assert.match(catalog + checkout, new RegExp(value));
  assert.ok(checkout.includes('billingContext("manage")'));
  assert.doesNotMatch(catalog + checkout, /pri_[a-z0-9]{10}|pro_[a-z0-9]{10}/);
  assert.match(provider, /customer_id/);
  assert.match(provider, /custom_data/);
});

test("webhooks verify raw HMAC signatures and reject replay", () => {
  for (const value of [
    "createHmac",
    "timingSafeEqual",
    "PADDLE_WEBHOOK_SECRET",
    "paddle-signature",
    "request.text()",
    "PADDLE_WEBHOOK_TOLERANCE_SECONDS",
  ])
    assert.match(
      provider + read("app/api/webhooks/paddle/route.ts"),
      new RegExp(value.replace(/[()]/g, "\\$&"), "i"),
    );
});

test("all requested Paddle events are supported and unknown events are ignored", () => {
  for (const event of [
    "transaction.completed",
    "subscription.created",
    "subscription.updated",
    "subscription.paused",
    "subscription.resumed",
    "subscription.canceled",
    "payment.failed",
    "payment.succeeded",
    "customer.updated",
  ])
    assert.match(provider + migration, new RegExp(event.replaceAll(".", "\\.")));
  assert.match(migration, /then 'processed' else 'ignored'/);
});

test("subscription sync reuses canonical tables and is idempotent", () => {
  for (const value of [
    "billing_customers",
    "subscriptions",
    "subscription_items",
    "invoices",
    "organization_limits",
    "provider_product_id",
    "provider_price_id",
    "provider_subscription_id",
    "current_period_ends_at",
    "canceled_at",
    "on conflict(provider,provider_event_id) do nothing",
    "if not found then return",
  ])
    assert.match(migration, new RegExp(value.replace(/[()]/g, "\\$&"), "i"));
  assert.doesNotMatch(migration, /create table/i);
});

test("upgrade downgrade seats cancellation resume and portal are Paddle-backed", () => {
  const subscription = read(
    "features/vayon/billing/services/paddle-subscription.service.ts",
  );
  const portal = read(
    "features/vayon/billing/services/paddle-customer.service.ts",
  );
  for (const value of [
    "changeSubscription",
    "quantity: seats",
    "cancelSubscription",
    "reactivateSubscription",
    "version",
    "portal-sessions",
    "subscriptionId",
  ])
    assert.match(subscription + portal + provider, new RegExp(value));
});

test("billing UI and observability identify Paddle as authoritative", () => {
  const pages =
    read("app/vayon/settings/billing/page.tsx") +
    read("app/vayon/settings/subscription/page.tsx");
  const telemetry =
    read("features/vayon/billing/services/paddle-checkout.service.ts") +
    read("features/vayon/billing/services/paddle-webhook.service.ts") +
    read("features/vayon/billing/services/paddle-subscription-sync.service.ts");
  for (const value of [
    "Paddle Checkout",
    "PaddlePortalButton",
    "paddle.checkout.started",
    "paddle.checkout.completed",
    "paddle.webhook.received",
    "paddle.webhook.processed",
    "paddle.subscription.synced",
    "paddle.payment.failed",
    "correlationId",
    "retryCount",
  ])
    assert.match(pages + telemetry, new RegExp(value));
});
