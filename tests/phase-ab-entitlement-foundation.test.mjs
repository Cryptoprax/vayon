import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
const requireEntitlementSource = readFileSync("features/vayon/billing/services/require-entitlement.ts", "utf8");

function hasFeature(plan, feature) {
  return subscriptionEntitlementCatalog[plan].features.includes(feature);
}

// 1-5: ai_workforce tier scoping
test("1: Starter does NOT have ai_workforce", () => {
  assert.equal(hasFeature("starter", "ai_workforce"), false);
});
test("2: Professional HAS ai_workforce", () => {
  assert.equal(hasFeature("professional", "ai_workforce"), true);
});
test("3: Business HAS ai_workforce", () => {
  assert.equal(hasFeature("business", "ai_workforce"), true);
});
test("4: Business Plus HAS ai_workforce", () => {
  assert.equal(hasFeature("business_plus", "ai_workforce"), true);
});
test("5: Enterprise HAS ai_workforce", () => {
  assert.equal(hasFeature("enterprise", "ai_workforce"), true);
});

// 6-13: pre-existing entitlement tiers are unchanged by this phase
test("6: customer_success remains Professional+", () => {
  assert.equal(hasFeature("starter", "customer_success"), false);
  for (const plan of ["professional", "business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, "customer_success"), true);
});
test("7: automation remains Professional+", () => {
  assert.equal(hasFeature("starter", "automation"), false);
  for (const plan of ["professional", "business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, "automation"), true);
});
test("8: advanced_analytics remains Business+", () => {
  for (const plan of ["starter", "professional"]) assert.equal(hasFeature(plan, "advanced_analytics"), false);
  for (const plan of ["business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, "advanced_analytics"), true);
});
test("9: api remains Business+", () => {
  for (const plan of ["starter", "professional"]) assert.equal(hasFeature(plan, "api"), false);
  for (const plan of ["business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, "api"), true);
});
test("10: priority_support remains Business+", () => {
  for (const plan of ["starter", "professional"]) assert.equal(hasFeature(plan, "priority_support"), false);
  for (const plan of ["business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, "priority_support"), true);
});
test("11: approvals remains Business+", () => {
  for (const plan of ["starter", "professional"]) assert.equal(hasFeature(plan, "approvals"), false);
  for (const plan of ["business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, "approvals"), true);
});
test("12: custom_roles remains Business Plus+", () => {
  for (const plan of ["starter", "professional", "business"]) assert.equal(hasFeature(plan, "custom_roles"), false);
  for (const plan of ["business_plus", "enterprise"]) assert.equal(hasFeature(plan, "custom_roles"), true);
});
test("13: audit remains Business Plus+", () => {
  for (const plan of ["starter", "professional", "business"]) assert.equal(hasFeature(plan, "audit"), false);
  for (const plan of ["business_plus", "enterprise"]) assert.equal(hasFeature(plan, "audit"), true);
});

// 14: Founding Professional parity -- entitlement lookup is keyed by plan_code only,
// never by Paddle price ID, so a founding-priced subscription resolves identically.
test("14: Founding Professional resolves exactly like standard Professional (lookup keys on plan_code, not price)", () => {
  const professional = subscriptionEntitlementCatalog.professional;
  // The catalog has no concept of "founding" at all -- there is only one "professional"
  // entry, looked up by plan code. A founding-priced subscription still has
  // plan_code === "professional", so it necessarily resolves to this exact object.
  assert.ok(professional.features.includes("ai_workforce"));
  assert.deepEqual(Object.keys(subscriptionEntitlementCatalog).includes("professional_founding"), false);
  const entitlementsSource = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");
  assert.doesNotMatch(entitlementsSource, /founding/i);
});

// 15-16: the new server guard
test("15: the new server guard delegates to SubscriptionEntitlementService.requireFeature rather than duplicating plan logic", () => {
  assert.match(requireEntitlementSource, /import \{ SubscriptionEntitlementError, SubscriptionEntitlementService \} from "\.\/entitlement\.service";/);
  assert.match(requireEntitlementSource, /new SubscriptionEntitlementService\(\)\.requireFeature\(feature\)/);
  assert.doesNotMatch(requireEntitlementSource, /planCodes|indexOf\(.*plan/i, "must not re-implement plan ranking");
  assert.doesNotMatch(requireEntitlementSource, /"starter"|"professional"|"business"|"enterprise"/, "must not hardcode plan names");
  assert.doesNotMatch(requireEntitlementSource, /redirect\(/, "the low-level guard must never redirect itself");
  // Three distinguishable outcomes, per the approved design.
  assert.match(requireEntitlementSource, /class FeatureNotEntitledError extends Error/);
  assert.match(requireEntitlementSource, /class SubscriptionProblemError extends Error/);
  assert.match(requireEntitlementSource, /class UnexpectedEntitlementError extends Error/);
});
// Phase A/B itself shipped zero call sites. Phase C1 wired the guard into six files.
// Option C (a later, separately approved controlled phase) added the remaining page-level
// gates on the customer-safe /vayon/ai/* routes and the chat API. This asserts the current
// allowlist rather than zero, so any *unexpected* future call site still fails.
test("16: only the Phase C1/Option C-approved call sites invoke the new guard -- nothing unexpected", () => {
  let output = "";
  try { output = execSync('git grep -l "requireEntitlement" -- ":!tests" ":!features/vayon/billing/services/require-entitlement.ts"', { cwd: process.cwd() }).toString(); }
  catch { output = ""; }
  const found = output.trim().split("\n").filter(Boolean).sort();
  const approved = [
    "app/vayon/customer-success/page.tsx",
    "app/vayon/workflows/page.tsx",
    "app/vayon/workflows/runtime/page.tsx",
    "features/platform/customer-success-workspace/actions/customer-success.actions.ts",
    "features/platform/workflows/actions/index.ts",
    "features/vayon/ai-workforce/actions/ai.actions.ts",
    "app/api/ai/workforce/chat/route.ts",
    "app/vayon/ai/automations/page.tsx",
    "app/vayon/ai/employees/[employeeId]/page.tsx",
    "app/vayon/ai/employees/page.tsx",
    "app/vayon/ai/goals/page.tsx",
    "app/vayon/ai/history/page.tsx",
    "app/vayon/ai/page.tsx",
    "app/vayon/ai/tasks/page.tsx",
    "app/vayon/ai/work-queue/page.tsx",
    "app/vayon/ai/workforce/[employeeId]/page.tsx",
    "app/vayon/ai/workforce/page.tsx",
    // Comment-only reference (explains why the visibility rule was removed); not a call site.
    "features/platform/visibility/policy.ts",
  ].sort();
  assert.deepEqual(found, approved);
});

// 17: nothing was unintentionally removed -- every previously-present feature key
// still exists at (at least) its previous tier.
test("17: no existing entitlement was unintentionally removed", () => {
  const previouslyExpected = {
    starter: ["crm", "calendar", "basic_ai", "knowledge", "email"],
    professional: ["integrations_marketplace", "marketing_ai", "sales_ai", "customer_success", "creative_studio", "workflow_automation", "google", "microsoft", "whatsapp", "automation"],
    business: ["advanced_ai", "advanced_analytics", "approvals", "api", "priority_support"],
  };
  for (const [plan, features] of Object.entries(previouslyExpected))
    for (const feature of features)
      assert.ok(hasFeature(plan, feature), `${plan} lost ${feature}`);
  assert.deepEqual([...subscriptionEntitlementCatalog.business_plus.features], [...subscriptionEntitlementCatalog.enterprise.features]);
});
