import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { subscriptionEntitlementCatalog } = load("features/vayon/billing/config/entitlements.ts");
function hasFeature(plan, feature) { return subscriptionEntitlementCatalog[plan].features.includes(feature); }

const aiWorkforceActions = readFileSync("features/vayon/ai-workforce/actions/ai.actions.ts", "utf8");
const customerSuccessActions = readFileSync("features/platform/customer-success-workspace/actions/customer-success.actions.ts", "utf8");
const workflowActions = readFileSync("features/platform/workflows/actions/index.ts", "utf8");
const creativeStudioActions = readFileSync("features/vayon/creative-studio/actions.ts", "utf8");
const accessService = readFileSync("features/vayon/creative-studio/access.service.ts", "utf8");
const featureLicensingService = readFileSync("features/vayon/billing/services/feature-licensing.service.ts", "utf8");
const customerSuccessPage = readFileSync("app/vayon/customer-success/page.tsx", "utf8");
const workflowsPage = readFileSync("app/vayon/workflows/page.tsx", "utf8");
const workflowsRuntimePage = readFileSync("app/vayon/workflows/runtime/page.tsx", "utf8");
const upgradeComponent = readFileSync("features/vayon/billing/components/EntitlementUpgradeRequired.tsx", "utf8");
const requireEntitlementSource = readFileSync("features/vayon/billing/services/require-entitlement.ts", "utf8");

// ---------------------------------------------------------------------------
// Tier matrix: STARTER denied, PROFESSIONAL/BUSINESS/BUSINESS PLUS/ENTERPRISE
// allowed, for every C1 entitlement key (including creative_studio, which is
// what the pre-existing Marketing Studio / Creative Studio gate actually checks).
// ---------------------------------------------------------------------------
for (const feature of ["creative_studio", "ai_workforce", "customer_success", "automation"]) {
  test(`${feature}: Starter DENIED, Professional/Business/Business Plus/Enterprise ALLOWED`, () => {
    assert.equal(hasFeature("starter", feature), false);
    for (const plan of ["professional", "business", "business_plus", "enterprise"]) assert.equal(hasFeature(plan, feature), true);
  });
}

// ---------------------------------------------------------------------------
// Marketing AI / Creative Studio: this family is ALREADY server-enforced via
// creativeStudioAccess() -> FeatureLicensingService.licensed("marketing_studio")
// -> the creative_studio entitlement. Verified, not newly added in C1.
// ---------------------------------------------------------------------------
test("Marketing Studio / Creative Studio: pre-existing server-side gate is present and maps to creative_studio", () => {
  assert.match(accessService, /FeatureLicensingService/);
  assert.match(accessService, /licensed\("marketing_studio"\)/);
  assert.match(featureLicensingService, /feature === "marketing_studio".*?"creative_studio"/s);
  assert.match(accessService, /new FeatureLicensingService\(\)/);
});
test("Marketing Studio draft-saving action re-derives access via CreativeStudioService.production() and never bypasses it", () => {
  assert.match(creativeStudioActions, /await guardSubscriptionAction\(\)/);
  assert.match(creativeStudioActions, /const service = await CreativeStudioService\.production\(\);\s*\n\s*if \(!service\) throw new Error\(accessError\);/);
});

// ---------------------------------------------------------------------------
// AI Workforce
// ---------------------------------------------------------------------------
test("AI Workforce actions: guardSubscriptionAction remains, requireEntitlement(ai_workforce) added after it, in every mutation", () => {
  for (const action of ["approveRecommendationAction", "rejectRecommendationAction", "createKnowledgeEntryAction", "archiveRecommendationAction"]) {
    const start = aiWorkforceActions.indexOf(`export async function ${action}`);
    assert.ok(start !== -1, `missing ${action}`);
    const body = aiWorkforceActions.slice(start, start + 250);
    assert.match(body, /await guardSubscriptionAction\(\);\s*\n\s*await requireEntitlement\("ai_workforce"\);/, `${action} must call guardSubscriptionAction then requireEntitlement("ai_workforce")`);
  }
});
test("AI Workforce: the blanket founder-only /vayon/ai visibility rule from this phase was superseded by Option C's page-level entitlement gates (see tests/option-c-ai-workforce-access.test.mjs)", () => {
  const policy = readFileSync("features/platform/visibility/policy.ts", "utf8");
  // Option C (a later, explicitly authorized controlled phase) opened the customer-safe
  // /vayon/ai/* routes to Professional+ customers and replaced this blanket founder-only
  // rule with per-page requireEntitlement("ai_workforce") checks. /vayon/ai/collaboration
  // and /vayon/ai/playground remain founder-only via their own specific rules.
  assert.doesNotMatch(policy, /pathPrefix: "\/vayon\/ai", industries: allIndustries, roles: founderRoles/);
  assert.match(policy, /pathPrefix: "\/vayon\/ai\/collaboration", industries: allIndustries, roles: founderRoles/);
  assert.match(policy, /pathPrefix: "\/vayon\/ai\/playground", industries: allIndustries, roles: founderRoles/);
  assert.match(aiWorkforceActions, /await requireEntitlement\("ai_workforce"\)/);
});

// ---------------------------------------------------------------------------
// Customer Success
// ---------------------------------------------------------------------------
test("Customer Success actions: guardSubscriptionAction remains, requireEntitlement(customer_success) added after it", () => {
  for (const action of ["completeCustomerSuccessTaskAction", "configureCustomerAIAction"]) {
    const start = customerSuccessActions.indexOf(`export async function ${action}`);
    assert.ok(start !== -1, `missing ${action}`);
    const body = customerSuccessActions.slice(start, start + 200);
    assert.match(body, /await guardSubscriptionAction\(\);\s*\n\s*await requireEntitlement\("customer_success"\);/);
  }
});
test("Customer Success page checks requireEntitlement before rendering workspace data and shows the upgrade state on denial", () => {
  assert.match(customerSuccessPage, /await requireEntitlement\("customer_success"\)/);
  assert.match(customerSuccessPage, /error instanceof FeatureNotEntitledError.*EntitlementUpgradeRequired/s);
});
test("the platform (founder/ops) customer-success module is untouched -- it is a different feature, not the customer-facing one", () => {
  const platformActions = readFileSync("features/platform/customer-success/actions/platform.actions.ts", "utf8");
  assert.doesNotMatch(platformActions, /requireEntitlement/);
});

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------
test("Automation actions: guardSubscriptionAction remains, requireEntitlement(automation) added after it", () => {
  for (const action of ["saveWorkflowAction", "publishWorkflowAction", "installWorkflowTemplateAction"]) {
    const start = workflowActions.indexOf(`export async function ${action}`);
    assert.ok(start !== -1, `missing ${action}`);
    const body = workflowActions.slice(start, start + 200);
    assert.match(body, /await guardSubscriptionAction\(\);\s*\n\s*await requireEntitlement\("automation"\);/);
  }
});
test("Automation pages check requireEntitlement and show the upgrade state on denial", () => {
  for (const page of [workflowsPage, workflowsRuntimePage]) {
    assert.match(page, /await requireEntitlement\("automation"\)/);
    assert.match(page, /FeatureNotEntitledError/);
    assert.match(page, /EntitlementUpgradeRequired/);
  }
});
test("the orphaned workflow-orchestrator module was not modified or resurrected", () => {
  // Rendered already (pre-existing), but its own directory receives no new file in this diff.
  let output = "";
  try { output = execSync('git status --short -- features/vayon/workflow-orchestrator', { cwd: process.cwd() }).toString(); } catch { output = ""; }
  assert.equal(output.trim(), "");
});
test("workflows/[workflowId] (Approvals/governance content, not Automation) was left untouched", () => {
  const source = readFileSync("app/vayon/workflows/[workflowId]/page.tsx", "utf8");
  assert.doesNotMatch(source, /requireEntitlement/);
});

// ---------------------------------------------------------------------------
// Cross-cutting: no Business/Business-Plus-only entitlement newly enforced
// ---------------------------------------------------------------------------
test("no Business-only or Business-Plus-only entitlement key was newly enforced in this phase", () => {
  for (const source of [aiWorkforceActions, customerSuccessActions, workflowActions, customerSuccessPage, workflowsPage, workflowsRuntimePage]) {
    for (const forbidden of ["advanced_analytics", "approvals", "\"api\"", "priority_support", "custom_roles", "\"audit\""]) {
      assert.doesNotMatch(source, new RegExp(`requireEntitlement\\(${forbidden.includes("\"") ? forbidden : `"${forbidden}"`}\\)`));
    }
  }
});

// ---------------------------------------------------------------------------
// Founding Professional parity (reconfirmed in the C1 context)
// ---------------------------------------------------------------------------
test("Founding Professional resolves identically to standard Professional for every C1 feature (plan_code based, no Paddle price lookup)", () => {
  for (const feature of ["creative_studio", "ai_workforce", "customer_success", "automation"]) assert.equal(hasFeature("professional", feature), true);
  assert.doesNotMatch(requireEntitlementSource, /founding|price|paddle/i);
});

// ---------------------------------------------------------------------------
// Denial UX
// ---------------------------------------------------------------------------
test("the shared upgrade-required component never initiates checkout/plan-change and only links to the billing page", () => {
  assert.match(upgradeComponent, /href: "\/vayon\/settings\/billing"/);
  assert.doesNotMatch(upgradeComponent, /checkout\(|paddle\.com|changePlan\(|manageSubscription\(|fetch\(/i);
  assert.doesNotMatch(upgradeComponent, /onClick|<form/);
  assert.match(upgradeComponent, /minimumPlanFor\(feature\)/, "the required-plan name must be derived from the catalog, not hardcoded");
});

// ---------------------------------------------------------------------------
// Behavioral proof: direct server-action invocation cannot bypass the check.
// ---------------------------------------------------------------------------
test("direct invocation of saveWorkflowAction is blocked before the mutation service runs when entitlement is denied", async () => {
  let mutationCalled = false, guardCalled = false, entitlementCalledWith = null;
  const { saveWorkflowAction } = load("features/platform/workflows/actions/index.ts", {
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionAction: async () => { guardCalled = true; } },
    "@/features/vayon/billing/services/require-entitlement": {
      requireEntitlement: async (feature) => { entitlementCalledWith = feature; throw new (class FeatureNotEntitledError extends Error {})("denied"); },
    },
    "next/cache": { revalidatePath() {} },
    "../services/automation.service": { WorkflowAutomationService: class { async save() { mutationCalled = true; } } },
  });
  const form = new FormData();
  form.set("definition", "{}");
  await assert.rejects(() => saveWorkflowAction(form));
  assert.equal(guardCalled, true, "the pre-existing subscription-status guard must still run");
  assert.equal(entitlementCalledWith, "automation");
  assert.equal(mutationCalled, false, "the mutation must never execute once entitlement is denied");
});
test("direct invocation of saveWorkflowAction proceeds normally when entitlement is granted", async () => {
  let mutationCalled = false;
  const { saveWorkflowAction } = load("features/platform/workflows/actions/index.ts", {
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionAction: async () => {} },
    "@/features/vayon/billing/services/require-entitlement": { requireEntitlement: async () => ({ allowed: true }) },
    "next/cache": { revalidatePath() {} },
    "../services/automation.service": { WorkflowAutomationService: class { async save() { mutationCalled = true; } } },
  });
  const form = new FormData();
  form.set("definition", "{}");
  await saveWorkflowAction(form);
  assert.equal(mutationCalled, true);
});
test("direct invocation of configureCustomerAIAction is blocked before the mutation runs when entitlement is denied", async () => {
  let sessionFetched = false;
  const { configureCustomerAIAction } = load("features/platform/customer-success-workspace/actions/customer-success.actions.ts", {
    "@/features/vayon/billing/services/subscription-write-guard": { guardSubscriptionAction: async () => {} },
    "@/features/vayon/billing/services/require-entitlement": {
      requireEntitlement: async () => { throw new (class FeatureNotEntitledError extends Error {})("denied"); },
    },
    "next/cache": { revalidatePath() {} },
    "@/features/onboarding/services/enterprise-onboarding.service": { EnterpriseOnboardingService: class { async session() { sessionFetched = true; return null; } } },
  });
  await assert.rejects(() => configureCustomerAIAction(["Marketing AI"]));
  assert.equal(sessionFetched, false, "no onboarding session lookup/mutation should occur once entitlement is denied");
});
