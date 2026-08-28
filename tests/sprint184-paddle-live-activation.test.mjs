import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Paddle production mode is explicit and rejects crossed credentials", async () => {
  const source = await read("features/vayon/billing/providers/paddle/paddle-client.ts");
  for (const value of ["PADDLE_ENVIRONMENT", "production", "live", "sandbox", "_sdbx_", "_live_", "Paddle-Version", "AbortSignal.timeout"]) assert.match(source, new RegExp(value.replaceAll(".", "\\.")));
  assert.doesNotMatch(source, /pdl_(?:live|sdbx)_apikey_[A-Za-z0-9_-]{20}/);
});

test("current Paddle lifecycle events project through the existing idempotent RPC", async () => {
  const [provider, sync, migration] = await Promise.all([read("features/vayon/billing/providers/paddle/paddle.provider.ts"), read("features/vayon/billing/services/paddle-subscription-sync.service.ts"), read("supabase/migrations/20260922000000_sprint143_paddle_billing_platform.sql")]);
  for (const event of ["transaction.paid", "transaction.payment_failed", "subscription.trialing", "subscription.activated", "subscription.past_due"]) assert.match(provider + sync, new RegExp(event.replaceAll(".", "\\.")));
  assert.match(sync, /process_paddle_billing_event/);
  assert.match(migration, /on conflict\(provider,provider_event_id\) do nothing/i);
});

test("billing observability, portal recovery, and revenue metrics are surfaced", async () => {
  const [webhook, portal, founder, integrations] = await Promise.all([read("features/vayon/billing/services/paddle-webhook.service.ts"), read("app/api/billing/paddle/portal/route.ts"), read("features/platform/founder/services/founder.service.ts"), read("features/platform/integrations/center/IntegrationCenter.tsx")]);
  for (const value of ["paddle.webhook.failed", "paddle.payment.failed", "paddle.trial.started", "paddle.trial.converted"]) assert.match(webhook, new RegExp(value.replaceAll(".", "\\.")));
  assert.match(portal, /PADDLE_PORTAL_UNAVAILABLE/);
  for (const value of ["Monthly Recurring Revenue", "Annual Recurring Revenue", "Trial Organizations", "Active Customers", "Monthly Churn", "Pending Payments"]) assert.match(founder, new RegExp(value));
  for (const value of ["Last webhook", "Portal available", "Webhook health"]) assert.match(integrations, new RegExp(value));
});

test("Paddle live billing audit passes", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-paddle-live.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
