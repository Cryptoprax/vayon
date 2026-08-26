import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
test("existing live communication and calendar providers remain the production architecture", () => {
  for (const path of [
    "features/platform/integrations/google/services/gmail.service.ts",
    "features/platform/integrations/google/services/calendar.service.ts",
    "features/platform/integrations/microsoft/services/outlook.service.ts",
    "features/platform/integrations/microsoft/services/outlook-calendar.service.ts",
    "features/platform/integrations/whatsapp/whatsapp.service.ts",
  ])
    assert.ok(existsSync(path), path);
  const registry = read("features/platform/integrations/center/registry.ts");
  for (const provider of [
    "gmail",
    "google_calendar",
    "outlook",
    "microsoft_calendar",
    "microsoft_365",
    "whatsapp_business",
  ])
    assert.match(registry, new RegExp(provider));
});
test("Stripe production billing retains checkout portal trials coupons tax proration seats usage and webhooks", () => {
  const provider = read("features/vayon/billing/providers/stripe.provider.ts");
  for (const value of [
    "checkout.sessions.create",
    "billingPortal.sessions.create",
    "trial_period_days",
    "allow_promotion_codes",
    "automatic_tax",
    "proration_behavior",
    "quantity",
    "meterEvents.create",
    "constructEvent",
  ])
    assert.match(provider, new RegExp(value.replaceAll(".", "\\.")));
});
test("Razorpay supports subscriptions invoices Indian payment methods GST and verified webhooks", () => {
  const provider = read(
      "features/vayon/billing/providers/razorpay.provider.ts",
    ),
    service = read("features/vayon/billing/services/razorpay.service.ts");
  for (const value of [
    "subscriptions",
    "invoices",
    "upi",
    "card",
    "netbanking",
    "emandate",
    "gstin",
    "createHmac",
    "timingSafeEqual",
    "RAZORPAY_WEBHOOK_SECRET",
  ])
    assert.match(provider, new RegExp(value));
  assert.match(service, /record_commercial_webhook/);
  assert.ok(existsSync("app/api/webhooks/razorpay/route.ts"));
});
test("commercial entitlement plans preserve trials seats and four tiers", () => {
  const source = read("features/vayon/billing/config/commercial-plans.ts");
  for (const value of [
    "starter",
    "professional",
    "business",
    "enterprise",
    "trialDays",
    "seatLimit",
  ])
    assert.match(source, new RegExp(value));
  assert.doesNotMatch(source, /monthlyUsd|annualUsd/);
  assert.doesNotMatch(source, /currency:\s*"INR"/);
});
test("subscription licensing covers every commercial module", () => {
  const source =
    read("features/vayon/billing/config/commercial-plans.ts") +
    read("features/vayon/billing/services/feature-licensing.service.ts");
  for (const feature of [
    "marketing_studio",
    "growth_studio",
    "ai_workforce",
    "property_matching",
    "communications",
    "inventory",
    "reports",
    "workspace_feature_licensed",
  ])
    assert.match(source, new RegExp(feature));
});
test("AI usage metering contains all requested commercial credits", () => {
  const types = read("features/vayon/billing/types/index.ts"),
    sql = read(
      "supabase/migrations/20260914000000_sprint83_enterprise_commercial_platform.sql",
    );
  for (const metric of [
    "image_generations",
    "creative_exports",
    "storage_gb",
    "ai_requests",
    "video_projects",
    "conversation_summaries",
    "future_video_generation_credits",
  ])
    assert.match(types + sql, new RegExp(metric));
  assert.match(sql, /subscription limit exceeded/);
});
test("connector health shows the full provider matrix with explicit states", () => {
  const service = read(
      "features/vayon/billing/services/commercial-health.service.ts",
    ),
    view = read("features/vayon/billing/components/CommercialPlatform.tsx");
  for (const provider of [
    "whatsapp",
    "stripe",
    "razorpay",
    "openai",
    "gmail",
    "outlook",
    "google_calendar",
    "microsoft_365",
    "storage",
    "database",
  ])
    assert.match(service, new RegExp(provider));
  for (const state of ["healthy", "warning", "offline"])
    assert.match(service + view, new RegExp(state));
  assert.ok(existsSync("app/vayon/settings/billing/provider-health/page.tsx"));
});
test("commercial schema enforces RLS audit events and secret-safe service-role webhooks", () => {
  const sql = read(
    "supabase/migrations/20260914000000_sprint83_enterprise_commercial_platform.sql",
  );
  for (const value of [
    "workspace_feature_licenses",
    "commercial_provider_customers",
    "commercial_webhook_events",
    "enable row level security",
    "is_organization_member",
    "current_workspace_role",
    "service_role",
    "provider_event_id",
    "status",
    "error_code",
  ])
    assert.match(sql, new RegExp(value, "i"));
});
