import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const { subscriptionEntitlementCatalog, quotaKeys, entitlementFeatures } =
  load("features/vayon/billing/config/entitlements.ts");
const { evaluateQuotaEntitlement } = load("features/vayon/billing/services/entitlement-policy.ts");
const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
const pricingTableSource = readFileSync("features/marketing/components/PricingTable.tsx", "utf8");
const paddleCatalogSource = readFileSync("features/vayon/billing/providers/paddle/paddle-catalog.ts", "utf8");

const approvedBusinessPlusQuotas = {
  workspaces: 25, users: 150, storage_gb: 1500, ai_requests: 150000, exports: 7500, reports: 7500,
  workflows: 3000, automations: 3000, integrations: 75, knowledge_articles: 30000, creative_assets: 7500, api_calls: 300000,
};

test("1: Business Plus quotas exactly equal the approved finite values", () => {
  assert.deepEqual(subscriptionEntitlementCatalog.business_plus.quotas, approvedBusinessPlusQuotas);
});

test("2: every Business Plus quota is finite (not null)", () => {
  for (const key of quotaKeys) assert.equal(typeof subscriptionEntitlementCatalog.business_plus.quotas[key], "number");
});

test("3: every Business Plus quota is >= the corresponding Business quota", () => {
  for (const key of quotaKeys) {
    assert.ok(
      subscriptionEntitlementCatalog.business_plus.quotas[key] >= subscriptionEntitlementCatalog.business.quotas[key],
      `${key}: business_plus (${subscriptionEntitlementCatalog.business_plus.quotas[key]}) must be >= business (${subscriptionEntitlementCatalog.business.quotas[key]})`,
    );
  }
});

test("4: Enterprise quotas remain null/unlimited for every key", () => {
  for (const key of quotaKeys) assert.equal(subscriptionEntitlementCatalog.enterprise.quotas[key], null);
});

test("5: Business Plus feature set is unchanged by this implementation", () => {
  assert.deepEqual([...subscriptionEntitlementCatalog.business_plus.features], [...entitlementFeatures]);
});

test("6: Starter, Professional and Business entitlement definitions are unchanged", () => {
  assert.deepEqual(subscriptionEntitlementCatalog.starter.quotas, {
    workspaces: 1, users: 3, storage_gb: 10, ai_requests: 1000, exports: 25, reports: 25,
    workflows: 0, automations: 0, integrations: 0, knowledge_articles: 100, creative_assets: 25, api_calls: 0,
  });
  assert.deepEqual(subscriptionEntitlementCatalog.professional.quotas, {
    workspaces: 3, users: 10, storage_gb: 100, ai_requests: 10000, exports: 500, reports: 500,
    workflows: 100, automations: 100, integrations: 5, knowledge_articles: 1000, creative_assets: 500, api_calls: 10000,
  });
  assert.deepEqual(subscriptionEntitlementCatalog.business.quotas, {
    workspaces: 10, users: 50, storage_gb: 500, ai_requests: 50000, exports: 2500, reports: 2500,
    workflows: 1000, automations: 1000, integrations: 25, knowledge_articles: 10000, creative_assets: 2500, api_calls: 100000,
  });
  assert.equal(subscriptionEntitlementCatalog.starter.features.length, 5);
  // Professional/Business grew by exactly one entry (ai_workforce) under the approved
  // Phase A/B entitlement foundation; Starter's count is untouched.
  assert.equal(subscriptionEntitlementCatalog.professional.features.length, 16);
  assert.equal(subscriptionEntitlementCatalog.business.features.length, 21);
});

test("7: Business Plus remains selfService === true", () => {
  const plan = commercialPricingPlans.find(p => p.code === "business_plus");
  assert.equal(plan.selfService, true);
});

test("8: Enterprise remains selfService === false", () => {
  const plan = commercialPricingPlans.find(p => p.code === "enterprise");
  assert.equal(plan.selfService, false);
});

test('9: nextPlan("business") resolves to business_plus', () => {
  const decision = evaluateQuotaEntitlement({ plan: "business", subscriptionStatus: "active" }, "workspaces", 999999);
  assert.equal(decision.allowed, false);
  assert.equal(decision.targetPlan, "business_plus");
});

test('10: nextPlan("business_plus") resolves to enterprise', () => {
  const decision = evaluateQuotaEntitlement({ plan: "business_plus", subscriptionStatus: "active" }, "workspaces", 999999);
  assert.equal(decision.allowed, false);
  assert.equal(decision.targetPlan, "enterprise");
});

test("11: public pricing CTA routes Business Plus to self-service signup and only Enterprise to Contact Sales", () => {
  assert.doesNotMatch(pricingTableSource, /plan\.name === "Business Plus"/);
  assert.match(pricingTableSource, /plan\.name === "Enterprise"\s*\n\s*\?\s*"\/contact\?intent=sales"/);
  assert.match(pricingTableSource, /\/signup\?plan=\$\{plan\.code\}/);
  assert.match(pricingTableSource, /plan\.name === "Enterprise" \? "Contact Sales" : "Get Started"/);
});

test("12: Business Plus price remains $799 monthly", () => {
  const plan = commercialPricingPlans.find(p => p.code === "business_plus");
  assert.equal(plan.standardMonthlyPrice, 799);
});

test("13: Business Plus Paddle catalog env-var names and price resolution are unchanged", () => {
  assert.match(paddleCatalogSource, /"business_plus"/);
  assert.match(paddleCatalogSource, /PADDLE_PRODUCT_\$\{plan\.toUpperCase\(\)\}/);
  assert.match(paddleCatalogSource, /PADDLE_PRICE_\$\{suffix\}/);
  assert.doesNotMatch(paddleCatalogSource, /\b(?:pri|pro)_[a-z0-9]+\b/i);
});
