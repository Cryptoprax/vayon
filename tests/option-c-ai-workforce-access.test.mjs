import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
const { canViewPath, visibilityRuleForPath } = load("features/platform/visibility/policy.ts");
function hasFeature(plan) { return subscriptionEntitlementCatalog[plan].features.includes("ai_workforce"); }

const realPages = {
  "app/vayon/ai/page.tsx": readFileSync("app/vayon/ai/page.tsx", "utf8"),
  "app/vayon/ai/workforce/page.tsx": readFileSync("app/vayon/ai/workforce/page.tsx", "utf8"),
  "app/vayon/ai/employees/page.tsx": readFileSync("app/vayon/ai/employees/page.tsx", "utf8"),
  "app/vayon/ai/employees/[employeeId]/page.tsx": readFileSync("app/vayon/ai/employees/[employeeId]/page.tsx", "utf8"),
  "app/vayon/ai/workforce/[employeeId]/page.tsx": readFileSync("app/vayon/ai/workforce/[employeeId]/page.tsx", "utf8"),
  "app/vayon/ai/tasks/page.tsx": readFileSync("app/vayon/ai/tasks/page.tsx", "utf8"),
  "app/vayon/ai/history/page.tsx": readFileSync("app/vayon/ai/history/page.tsx", "utf8"),
};
const fixturePages = {
  "app/vayon/ai/goals/page.tsx": readFileSync("app/vayon/ai/goals/page.tsx", "utf8"),
  "app/vayon/ai/automations/page.tsx": readFileSync("app/vayon/ai/automations/page.tsx", "utf8"),
  "app/vayon/ai/work-queue/page.tsx": readFileSync("app/vayon/ai/work-queue/page.tsx", "utf8"),
};
const chatRoute = readFileSync("app/api/ai/workforce/chat/route.ts", "utf8");
const collaborateRoute = readFileSync("app/api/ai/workforce/collaborate/route.ts", "utf8");
const visibilityPolicy = readFileSync("features/platform/visibility/policy.ts", "utf8");
const navigation = readFileSync("features/vayon/product-shell/navigation.ts", "utf8");
const aiWorkforceActions = readFileSync("features/vayon/ai-workforce/actions/ai.actions.ts", "utf8");
const customerSuccessActions = readFileSync("features/platform/customer-success-workspace/actions/customer-success.actions.ts", "utf8");
const workflowActions = readFileSync("features/platform/workflows/actions/index.ts", "utf8");

// ---------------------------------------------------------------------------
// 1-5: ai_workforce tier matrix (Starter denied; Professional+/Founding allowed)
// ---------------------------------------------------------------------------
test("1: Starter is DENIED ai_workforce", () => { assert.equal(hasFeature("starter"), false); });
test("2: Professional is ALLOWED ai_workforce", () => { assert.equal(hasFeature("professional"), true); });
test("3: Business is ALLOWED ai_workforce", () => { assert.equal(hasFeature("business"), true); });
test("4: Business Plus is ALLOWED ai_workforce", () => { assert.equal(hasFeature("business_plus"), true); });
test("5: Enterprise is ALLOWED ai_workforce", () => { assert.equal(hasFeature("enterprise"), true); });
test("6: Founding Professional resolves identically to standard Professional (plan_code based)", () => {
  // The catalog has exactly one "professional" entry, looked up only by plan_code;
  // a founding-priced subscription still carries plan_code === "professional".
  assert.ok(subscriptionEntitlementCatalog.professional.features.includes("ai_workforce"));
  assert.doesNotMatch(readFileSync("features/vayon/billing/config/entitlements.ts", "utf8"), /founding/i);
});

// ---------------------------------------------------------------------------
// Every real customer-safe page gates on requireEntitlement("ai_workforce") and
// checks it BEFORE reading params/fetching data (no bypass via dynamic segments).
// ---------------------------------------------------------------------------
for (const [path, source] of Object.entries(realPages)) {
  test(`${path}: gates on requireEntitlement("ai_workforce") and shows the upgrade state on denial`, () => {
    assert.match(source, /await requireEntitlement\("ai_workforce"\)/);
    assert.match(source, /FeatureNotEntitledError/);
    assert.match(source, /EntitlementUpgradeRequired/);
  });
}
test("13: dynamic employee routes check entitlement before reading route params or fetching data", () => {
  for (const path of ["app/vayon/ai/employees/[employeeId]/page.tsx", "app/vayon/ai/workforce/[employeeId]/page.tsx"]) {
    const source = realPages[path];
    const entitlementIndex = source.indexOf("requireEntitlement(");
    const paramsIndex = source.indexOf("await params");
    assert.ok(entitlementIndex !== -1 && paramsIndex !== -1, `${path} missing expected markers`);
    assert.ok(entitlementIndex < paramsIndex, `${path}: entitlement check must run before params are read`);
  }
});

// ---------------------------------------------------------------------------
// Fixture-backed pages: gated, and no longer render fake per-tenant data.
// ---------------------------------------------------------------------------
for (const [path, source] of Object.entries(fixturePages)) {
  test(`${path}: gated, and no longer imports the fixture-backed AutonomousWorkforceViews components`, () => {
    assert.match(source, /await requireEntitlement\("ai_workforce"\)/);
    assert.match(source, /FeatureAvailabilityState/);
    assert.doesNotMatch(source, /AutonomousWorkforceViews/);
    assert.doesNotMatch(source, /^import.*(GoalsAndStrategy|AutomationRules|AIWorkQueue|EmployeeActivity)/m);
  });
}

// ---------------------------------------------------------------------------
// 7-8, 14: Chat API -- fails closed for Starter, still requires existing checks
// ---------------------------------------------------------------------------
test("7/14: chat API checks permission, subscription status, and entitlement, in that order, before the runtime executes", () => {
  const permissionIndex = chatRoute.indexOf('enforceApiPermission("ai_employees","create")');
  const subscriptionIndex = chatRoute.indexOf("guardSubscriptionApi()");
  const entitlementIndex = chatRoute.indexOf('requireEntitlement("ai_workforce")');
  const rateLimitIndex = chatRoute.indexOf("new EnterpriseRateLimitService()");
  assert.ok(permissionIndex !== -1 && subscriptionIndex !== -1 && entitlementIndex !== -1 && rateLimitIndex !== -1, "expected all four checks to be present");
  assert.ok(permissionIndex < subscriptionIndex, "permission check must run before the subscription-status check");
  assert.ok(subscriptionIndex < entitlementIndex, "subscription-status check must run before the entitlement check");
  assert.ok(entitlementIndex < rateLimitIndex, "entitlement check must run before the runtime/rate-limit logic");
});
test("chat API returns a 403 and never reaches the runtime when ai_workforce is denied", async () => {
  let runtimeCalled = false;
  const { POST } = load("app/api/ai/workforce/chat/route.ts", {
    "@/features/vayon/billing/services/subscription-write-contract": { subscriptionStreamFailure: () => ({}) },
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionApi: async () => null },
    zod: await import("zod"),
    "@/features/platform/openai/runtime/service": { WorkforceRuntimeService: { production: async () => { runtimeCalled = true; return { chat: async function* () {} }; } } },
    "@/features/platform/security-review/services/rate-limit.service": { EnterpriseRateLimitService: class { async enforce() { runtimeCalled = true; return { allowed: true }; } }, requestSubject: () => "test" },
    "@/features/platform/permissions/runtime/http": { enforceApiPermission: async () => ({ response: null }) },
    "@/features/vayon/billing/services/require-entitlement": (() => {
      class FeatureNotEntitledError extends Error {}
      return { requireEntitlement: async () => { throw new FeatureNotEntitledError("denied"); }, FeatureNotEntitledError };
    })(),
  });
  const response = await POST(new Request("https://example.test/api/ai/workforce/chat", { method: "POST", body: JSON.stringify({ employee: "sales-ai", message: "hi" }) }));
  assert.equal(response.status, 403);
  assert.equal(runtimeCalled, false, "the AI runtime must never execute once entitlement is denied");
});
test("8: chat API still enforces ai_employees permission even when entitlement would be granted", async () => {
  let permissionChecked = false, runtimeCalled = false;
  const { POST } = load("app/api/ai/workforce/chat/route.ts", {
    "@/features/vayon/billing/services/subscription-write-contract": { subscriptionStreamFailure: () => ({}) },
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionApi: async () => null },
    zod: await import("zod"),
    "@/features/platform/openai/runtime/service": { WorkforceRuntimeService: { production: async () => { runtimeCalled = true; return { chat: async function* () {} }; } } },
    "@/features/platform/security-review/services/rate-limit.service": { EnterpriseRateLimitService: class { async enforce() { return { allowed: true }; } }, requestSubject: () => "test" },
    "@/features/platform/permissions/runtime/http": { enforceApiPermission: async () => { permissionChecked = true; return { response: Response.json({ error: "Forbidden" }, { status: 403 }) }; } },
    "@/features/vayon/billing/services/require-entitlement": { requireEntitlement: async () => ({ allowed: true }), FeatureNotEntitledError: class extends Error {} },
  });
  const response = await POST(new Request("https://example.test/api/ai/workforce/chat", { method: "POST", body: JSON.stringify({ employee: "sales-ai", message: "hi" }) }));
  assert.equal(permissionChecked, true);
  assert.equal(response.status, 403);
  assert.equal(runtimeCalled, false, "permission denial must still block the runtime regardless of entitlement");
});

// ---------------------------------------------------------------------------
// 9-10: Collaboration and Playground remain Founder/Super Admin only
// ---------------------------------------------------------------------------
test("9: /vayon/ai/collaboration remains Founder/Super Admin only", () => {
  const rule = visibilityRuleForPath("/vayon/ai/collaboration");
  assert.ok(rule, "expected a visibility rule to match");
  assert.deepEqual([...rule.roles].sort(), ["Founder", "Super Admin"].sort());
  assert.equal(canViewPath({ founder: false, role: "Admin", industry: "REAL_ESTATE" }, "/vayon/ai/collaboration"), false);
  assert.equal(canViewPath({ founder: true, role: "Founder", industry: "REAL_ESTATE" }, "/vayon/ai/collaboration"), true);
});
test("10: /vayon/ai/playground remains Founder/Super Admin only", () => {
  const rule = visibilityRuleForPath("/vayon/ai/playground");
  assert.ok(rule, "expected a visibility rule to match");
  assert.deepEqual([...rule.roles].sort(), ["Founder", "Super Admin"].sort());
  assert.equal(canViewPath({ founder: false, role: "Admin", industry: "REAL_ESTATE" }, "/vayon/ai/playground"), false);
  assert.equal(canViewPath({ founder: true, role: "Founder", industry: "REAL_ESTATE" }, "/vayon/ai/playground"), true);
});
test("customer-safe AI Workforce routes are no longer blanket-hidden by visibility policy", () => {
  for (const path of ["/vayon/ai", "/vayon/ai/workforce", "/vayon/ai/employees", "/vayon/ai/tasks", "/vayon/ai/work-queue", "/vayon/ai/history", "/vayon/ai/goals", "/vayon/ai/automations"]) {
    assert.equal(canViewPath({ founder: false, role: "Agent", industry: "REAL_ESTATE" }, path), true, `${path} should no longer be founder-only`);
  }
  assert.doesNotMatch(visibilityPolicy, /id: "platform-ai-team"/);
});
test("navigation: founder-only and fixture-backed AI destinations were removed; the real task queue is linked instead", () => {
  assert.doesNotMatch(navigation, /href: "\/vayon\/ai\/collaboration"/, "founder-only Suggestions link must not appear in customer navigation");
  assert.doesNotMatch(navigation, /href: "\/vayon\/ai\/automations"/, "fixture-backed Automations link should be decluttered from navigation");
  assert.doesNotMatch(navigation, /href: "\/vayon\/ai\/goals"/, "fixture-backed AI Goals link should be decluttered from navigation");
  assert.doesNotMatch(navigation, /href: "\/vayon\/ai\/work-queue"/, "fixture-backed Work Queue link must be repointed, not left in navigation");
  assert.match(navigation, /"Today's AI Tasks", href: "\/vayon\/ai\/tasks"/, "Today's AI Tasks must point at the real, tenant-scoped task queue");
});
test("unrelated visibility rules remain unchanged", () => {
  for (const rule of ['id: "platform", pathPrefix: "/platform"', 'id: "developer-brain", pathPrefix: "/vayon/brain"', 'id: "administration", pathPrefix: "/vayon/admin"', 'id: "platform-ai-workforce", pathPrefix: "/vayon/workforce"', 'id: "founder-approvals", pathPrefix: "/vayon/founder"'])
    assert.match(visibilityPolicy, new RegExp(rule.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  // /vayon/workforce (legacy, distinct from /vayon/ai/workforce) stays founder-only -- untouched.
  assert.equal(canViewPath({ founder: false, role: "Admin", industry: "REAL_ESTATE" }, "/vayon/workforce"), false);
});

// ---------------------------------------------------------------------------
// 11-12: Collaborate API hardening
// ---------------------------------------------------------------------------
async function runCollaborate({ user, permissionAllowed = true }) {
  const { POST } = load("app/api/ai/workforce/collaborate/route.ts", {
    "@/features/vayon/billing/services/subscription-write-contract": { subscriptionFailure: () => null, subscriptionMessage: () => "", subscriptionCenterHref: () => "" },
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionApi: async () => null },
    zod: await import("zod"),
    "@/features/platform/ai-collaboration": { AICollaborationService: { production: async () => ({ collaborate: async () => ({ ok: true }) }) } },
    "@/features/platform/permissions/runtime/http": { enforceApiPermission: async () => (permissionAllowed ? { response: null } : { response: Response.json({ error: "Forbidden" }, { status: 403 }) }) },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    "@/features/platform/founder/services/founder-context": { isFounder: (u) => u?.app_metadata?.role === "founder" || u?.app_metadata?.role === "super_admin" },
  });
  return POST(new Request("https://example.test/api/ai/workforce/collaborate", { method: "POST", body: JSON.stringify({ requestedBy: "sales-ai", scenario: "custom", objective: "test" }) }));
}
test("12: founder is allowed through the collaborate API's founder gate", async () => {
  const response = await runCollaborate({ user: { app_metadata: { role: "founder" } } });
  assert.equal(response.status, 202);
});
test("12: super_admin is allowed through the collaborate API's founder gate", async () => {
  const response = await runCollaborate({ user: { app_metadata: { role: "super_admin" } } });
  assert.equal(response.status, 202);
});
test("11: an ordinary customer (even with ai_employees permission) is denied by the collaborate API's founder gate", async () => {
  const response = await runCollaborate({ user: { app_metadata: { role: "organization_admin" } }, permissionAllowed: true });
  assert.equal(response.status, 403);
});
test("11: an unauthenticated caller is denied by the collaborate API's founder gate", async () => {
  const response = await runCollaborate({ user: null });
  assert.equal(response.status, 403);
});
test("collaborate route source: founder check runs before the permission/subscription checks", () => {
  const founderIndex = collaborateRoute.indexOf("isFounder(user)");
  const permissionIndex = collaborateRoute.indexOf('enforceApiPermission("ai_employees","create")');
  assert.ok(founderIndex !== -1 && permissionIndex !== -1);
  assert.ok(founderIndex < permissionIndex);
});

// ---------------------------------------------------------------------------
// 15: no route uses the dead FeatureLicensingService.licensed("ai_workforce") mapping
// ---------------------------------------------------------------------------
test('15: no code calls FeatureLicensingService.licensed("ai_workforce")', () => {
  let output = "";
  try { output = execSync('git grep -n "licensed(\\"ai_workforce\\")" -- ":!tests"', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
});
test("FeatureLicensingService's dead ai_workforce->advanced_ai mapping is untouched (documented as technical debt, not corrected in this phase)", () => {
  const source = readFileSync("features/vayon/billing/services/feature-licensing.service.ts", "utf8");
  assert.match(source, /feature === "ai_workforce" \? "advanced_ai"/);
});

// ---------------------------------------------------------------------------
// 17: existing Customer Success / Automation Phase C1 gates remain intact
// ---------------------------------------------------------------------------
test("17: Customer Success and Automation Phase C1 gates are unchanged", () => {
  assert.match(customerSuccessActions, /await requireEntitlement\("customer_success"\)/);
  assert.match(workflowActions, /await requireEntitlement\("automation"\)/);
  assert.match(readFileSync("app/vayon/customer-success/page.tsx", "utf8"), /await requireEntitlement\("customer_success"\)/);
  assert.match(readFileSync("app/vayon/workflows/page.tsx", "utf8"), /await requireEntitlement\("automation"\)/);
});

// ---------------------------------------------------------------------------
// C1 knowledge/recommendation action classification (unchanged, per audit)
// ---------------------------------------------------------------------------
test("knowledge action classification: createKnowledgeEntryAction is AI-Workforce-specific and its gate is unchanged", () => {
  assert.match(aiWorkforceActions, /await requireEntitlement\("ai_workforce"\);\s*\nconst p=knowledgeSchema/);
  const knowledgeForm = readFileSync("features/vayon/ai-workforce/components/KnowledgeForm.tsx", "utf8");
  assert.match(knowledgeForm, /createKnowledgeEntryAction/);
  // Its only caller targets the AI-workforce-specific source types (ai_knowledge table),
  // not the general Knowledge Base feature (which uses a different service entirely).
  const knowledgePage = readFileSync("app/vayon/knowledge/page.tsx", "utf8");
  assert.match(knowledgePage, /EnterpriseKnowledgeService/);
  assert.doesNotMatch(knowledgePage, /createKnowledgeEntryAction|ai-workforce/);
});
test("all four C1-classified AI Workforce actions keep their ai_workforce gate", () => {
  for (const action of ["approveRecommendationAction", "rejectRecommendationAction", "createKnowledgeEntryAction", "archiveRecommendationAction"]) {
    const start = aiWorkforceActions.indexOf(`export async function ${action}`);
    assert.ok(start !== -1, `missing ${action}`);
    assert.match(aiWorkforceActions.slice(start, start + 250), /await guardSubscriptionAction\(\);\s*\nawait requireEntitlement\("ai_workforce"\);/);
  }
});

// ---------------------------------------------------------------------------
// 18-20: unrelated behavior unchanged
// ---------------------------------------------------------------------------
test("18: Marketing/Creative Studio entitlement mechanism is unchanged", () => {
  const accessService = readFileSync("features/vayon/creative-studio/access.service.ts", "utf8");
  assert.match(accessService, /licensed\("marketing_studio"\)/);
});
test("19: existing-subscriber upgrade/downgrade and Founding checkout mechanisms are unchanged", () => {
  const commercialPlatform = readFileSync("features/vayon/billing/components/CommercialPlatform.tsx", "utf8");
  const subscriptionCenterActions = readFileSync("features/vayon/billing/actions/subscription-center.actions.ts", "utf8");
  assert.match(commercialPlatform, /manageSubscription/);
  assert.match(subscriptionCenterActions, /export async function manageSubscription/);
  // Option C touches AI Workforce / Customer Success / Automation entitlement gating only;
  // it must not add anything to the plan-change/checkout pipeline itself.
  assert.doesNotMatch(subscriptionCenterActions, /requireEntitlement\("ai_workforce"\)/);
});
test("20: no pricing/package copy file was newly created by this phase", () => {
  let output = "";
  try { output = execSync("git status --short -- features/marketing/components/PricingTable.tsx features/platform/commercial-pricing.ts", { cwd: process.cwd() }).toString(); } catch { output = ""; }
  // PricingTable.tsx may legitimately show as modified from an EARLIER, already-reviewed
  // pass (preserved, not reverted, per instruction) -- this only proves Option C did not
  // introduce a brand-new untracked pricing file.
  assert.equal(output.includes("??"), false, "no new untracked pricing file should appear");
});
