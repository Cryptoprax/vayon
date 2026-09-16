import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261030020000_sprint236_paddle_provider_compatibility.sql");
const legacySchema = read("supabase/migrations/20260914000000_sprint83_enterprise_commercial_platform.sql");
const paddleCustomer = read("features/vayon/billing/services/paddle-customer.service.ts");
const paddleProjection = read("supabase/migrations/20260922000000_sprint143_paddle_billing_platform.sql");

test("Sprint 236 replaces only the legacy billing customer provider allow-list", () => {
  assert.match(legacySchema, /provider text not null check\(provider in\('stripe','razorpay'\)\)/);
  assert.match(migration, /'public\.billing_customers'::regclass/);
  assert.match(migration, /'stripe'/);
  assert.match(migration, /'razorpay'/);
  assert.match(migration, /'paddle'/);
  assert.match(migration, /check \(provider in \('stripe', 'razorpay', 'paddle'\)\)/);
  assert.doesNotMatch(migration, /delete from|update public\.billing_customers|truncate/i);
});

test("the forward migration is a no-op when no legacy provider constraint exists", () => {
  assert.match(migration, /!~\* '''paddle'''/);
  assert.match(migration, /v_expanded_legacy boolean := false/);
  assert.match(migration, /v_expanded_legacy := true/);
  assert.match(migration, /if v_expanded_legacy then/);
  assert.match(migration, /~\* '''stripe'''/);
  assert.match(migration, /~\* '''razorpay'''/);
  assert.doesNotMatch(migration, /if not exists \(/);
});

test("Paddle customer and webhook projections persist IDs in their provider-specific fields", () => {
  assert.match(paddleCustomer, /provider:\s*"paddle"/);
  assert.match(paddleCustomer, /provider_customer_id:\s*customer\.id/);
  assert.match(paddleCustomer, /onConflict:\s*"workspace_id"/);
  for (const field of ["provider_customer_id", "provider_subscription_id", "provider_product_id", "provider_price_id"]) {
    assert.match(paddleProjection, new RegExp(field));
  }
  assert.match(paddleProjection, /on conflict\(provider,provider_event_id\) do nothing/);
  assert.match(paddleProjection, /on conflict\(provider_item_id\) do update/);
});
