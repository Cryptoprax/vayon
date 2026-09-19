import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const pricingTable = readFileSync("features/marketing/components/PricingTable.tsx", "utf8");
const commercialPlatform = readFileSync("features/vayon/billing/components/CommercialPlatform.tsx", "utf8");
const subscriptionManagement = readFileSync("features/vayon/billing/components/SubscriptionManagement.tsx", "utf8");
const entitlements = readFileSync("features/vayon/billing/config/entitlements.ts", "utf8");

const planHighlightsSource = pricingTable.slice(pricingTable.indexOf("const planHighlights"), pricingTable.indexOf("\nconst faqs"));
const highlightKeyOrder = ["Starter", "Professional", "Business", "Business Plus", "Enterprise"];
function highlightsFor(planName) {
  const start = planHighlightsSource.indexOf(planName === "Business Plus" ? '"Business Plus"' : `${planName}:`);
  assert.ok(start !== -1, `expected to find a planHighlights entry for ${planName}`);
  const nextKeyIndex = highlightKeyOrder.indexOf(planName) + 1;
  const nextKey = highlightKeyOrder[nextKeyIndex];
  const end = nextKey ? planHighlightsSource.indexOf(nextKey === "Business Plus" ? '"Business Plus"' : `${nextKey}:`, start) : planHighlightsSource.length;
  return planHighlightsSource.slice(start, end === -1 ? planHighlightsSource.length : end);
}

test("1: Starter card exposes verified core capabilities drawn from starterFeatures", () => {
  const block = highlightsFor("Starter");
  assert.match(block, /Core tools to launch and run the business\./);
  for (const capability of ["CRM", "Calendar", "AI assistant", "Knowledge base", "Email"]) assert.match(block, new RegExp(capability));
  // Every listed capability must correspond to a real starterFeatures entry.
  assert.match(entitlements, /const starterFeatures = \["crm", "calendar", "basic_ai", "knowledge", "email"\]/);
});
test("2: Professional communicates progression from Starter", () => {
  assert.match(highlightsFor("Professional"), /progressiveFrom: "Starter"/);
  assert.match(pricingTable, /Everything in \{planHighlights\[plan\.name\]\.progressiveFrom\}, plus:/);
});
test("3: Professional exposes verified differentiators drawn from professionalFeatures", () => {
  const block = highlightsFor("Professional");
  for (const capability of ["Marketing AI", "AI sales assistant", "Customer success tools", "Creative Studio", "Workflow automation", "Google, Microsoft & WhatsApp"]) assert.match(block, new RegExp(capability.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(entitlements, /"integrations_marketplace", "marketing_ai", "sales_ai", "customer_success",\s*\n\s*"creative_studio", "workflow_automation", "ai_workforce", "google", "microsoft", "whatsapp", "automation"/);
});
test("4: Business communicates progression from Professional", () => {
  assert.match(highlightsFor("Business"), /progressiveFrom: "Professional"/);
});
test("5: Business exposes verified differentiators drawn from businessFeatures", () => {
  const block = highlightsFor("Business");
  for (const capability of ["Advanced AI", "Advanced analytics", "Approval workflows", "API access", "Priority support"]) assert.match(block, new RegExp(capability));
  assert.match(entitlements, /"advanced_ai", "advanced_analytics", "approvals", "api", "priority_support"/);
});
test("6: Business Plus communicates progression from Business", () => {
  assert.match(highlightsFor("Business Plus"), /progressiveFrom: "Business"/);
});
test("7: Business Plus exposes only verified differentiators -- no unverified claim (SSO/White Label/Version History/Dedicated Success Manager) is promoted", () => {
  const block = highlightsFor("Business Plus");
  for (const capability of ["Audit logs", "Role management"]) assert.match(block, new RegExp(capability));
  for (const unverified of ["SSO", "White Label", "Private Cloud", "Version History", "Dedicated Success Manager", "Custom Integrations", "SLA"]) assert.doesNotMatch(block, new RegExp(unverified));
});
test("8: Enterprise communicates progression from Business Plus with contractual/custom framing", () => {
  const block = highlightsFor("Enterprise");
  assert.match(block, /progressiveFrom: "Business Plus"/);
  assert.match(block, /Custom enterprise operating environment\./);
});
test("9: Enterprise remains Contact Sales and non-self-service", () => {
  assert.match(pricingTable, /plan\.name === "Enterprise"\s*\n\s*\? "\/contact\?intent=sales"/);
  assert.match(pricingTable, /\{plan\.name === "Enterprise" \? "Contact Sales" : "Get Started"\}/);
  const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
  assert.equal(commercialPricingPlans.find((p) => p.code === "enterprise").selfService, false);
});
test("10-13: every self-service plan CTA reads Get Started", () => {
  assert.doesNotMatch(pricingTable, /"Start Free"/);
  const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
  for (const plan of commercialPricingPlans.filter((p) => p.selfService)) assert.equal(plan.code === "enterprise", false);
  assert.match(pricingTable, /\{plan\.name === "Enterprise" \? "Contact Sales" : "Get Started"\}/);
});
test("14-15: monthly and annual destinations both preserve plan and period query parameters", () => {
  assert.match(pricingTable, /\/signup\?plan=\$\{plan\.code\}&period=\$\{annual \? "annual" : "monthly"\}/);
});
test("16: Enterprise destination remains /contact?intent=sales", () => {
  assert.match(pricingTable, /"\/contact\?intent=sales"/);
});
test("17: Founding pricing behavior is unchanged", () => {
  assert.match(pricingTable, /Limited to the first \{plan\.promotion\?\.limitAgencies\} eligible agencies\. Professional is \$79\/month for \{plan\.promotion\?\.durationMonths\} successful monthly billing periods instead of the standard \$149\/month\. Eligibility is confirmed at checkout\./);
  const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
  const professional = commercialPricingPlans.find((p) => p.code === "professional");
  assert.deepEqual(professional.promotion, { type: "founding_member", enabled: true, promotionalMonthlyPrice: 79, limitAgencies: 20, durationMonths: 12 });
  assert.equal(professional.standardMonthlyPrice, 149);
});
test("18: package prices are unchanged", () => {
  const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
  const prices = Object.fromEntries(commercialPricingPlans.map((p) => [p.code, p.standardMonthlyPrice]));
  assert.deepEqual(prices, { starter: 79, professional: 149, business: 399, business_plus: 799, enterprise: null });
});
test("19: numeric capacity limits are unchanged", () => {
  const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
  const limits = Object.fromEntries(commercialPricingPlans.map((p) => [p.code, { seats: p.seats, workspaces: p.workspaces, storage: p.storage }]));
  assert.deepEqual(limits, {
    starter: { seats: "3", workspaces: "1", storage: "10 GB" },
    professional: { seats: "10", workspaces: "3", storage: "100 GB" },
    business: { seats: "50", workspaces: "10", storage: "500 GB" },
    business_plus: { seats: "150", workspaces: "25", storage: "1,500 GB" },
    enterprise: { seats: "Unlimited", workspaces: "Unlimited", storage: "Custom" },
  });
});
test("20: existing-subscriber upgrade behavior is unchanged", () => {
  assert.match(commercialPlatform, /action === "upgrade" \? <Button className="w-full" variant="primary" disabled=\{busy !== null\} onClick=\{\(\) => changePlan\(displayPlan\.code\)\}>\{busy === displayPlan\.code \? "Updating plan\.\.\." : "Upgrade to " \+ displayPlan\.name\}<\/Button>/);
});
test("21: downgrade safety is unchanged", () => {
  assert.match(commercialPlatform, /Downgrades are managed separately\./);
  assert.match(subscriptionManagement, /That plan change is not available here\. Contact support to downgrade\./);
});
test("22: no automatic checkout was introduced by the card-content change", () => {
  const start = pricingTable.indexOf("<ButtonLink");
  const planCardLink = pricingTable.slice(start, pricingTable.indexOf("</ButtonLink>", start) + "</ButtonLink>".length);
  assert.doesNotMatch(planCardLink, /onClick/);
  assert.doesNotMatch(pricingTable, /fetch\(/);
  // The new highlight block must render plain text/list items only -- no interactive elements.
  const highlightsBlockStart = pricingTable.indexOf("planHighlights[plan.name] &&");
  const highlightsBlockEnd = pricingTable.indexOf("</div>}", highlightsBlockStart);
  const highlightsBlock = pricingTable.slice(highlightsBlockStart, highlightsBlockEnd);
  assert.doesNotMatch(highlightsBlock, /onClick|<form|<button/i);
});
test("comparison table capacity rows and card capacity rows use the same source values", () => {
  assert.match(pricingTable, /\{plan\.seats\} team members/);
  assert.match(pricingTable, /\{plan\.workspaces\} workspaces/);
  assert.match(pricingTable, /\{plan\.storage\} storage/);
  assert.match(pricingTable, /if \(row === "Team Members"\) return plans\[plan\]\.seats;/);
});
