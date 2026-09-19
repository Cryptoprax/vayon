import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const pricingTable = readFileSync("features/marketing/components/PricingTable.tsx", "utf8");
const commercialPlatform = readFileSync("features/vayon/billing/components/CommercialPlatform.tsx", "utf8");
const subscriptionManagement = readFileSync("features/vayon/billing/components/SubscriptionManagement.tsx", "utf8");
const commercialPricing = readFileSync("features/platform/commercial-pricing.ts", "utf8");
const marketingShell = readFileSync("features/marketing/components/MarketingShell.tsx", "utf8");
const homepage = readFileSync("features/marketing/components/Homepage.tsx", "utf8");

// The public pricing card CTA is a single ternary shared by every self-service
// plan, so one exact-source assertion proves 1-4 (Starter/Professional/Business/
// Business Plus) simultaneously -- there is no per-plan wording to drift.
test("1-4: every self-service plan card CTA (Starter, Professional, Business, Business Plus) reads Get Started", () => {
  assert.match(pricingTable, /\{plan\.name === "Enterprise" \? "Contact Sales" : "Get Started"\}/);
  assert.doesNotMatch(pricingTable, /"Start Free"/);
});
test("5-6: the CTA copy does not vary by billing period -- monthly and annual both render Get Started", () => {
  // The button JSX sits outside the monthly/annual branch entirely; period only
  // ever changes the href's `period=` query value, never the visible label.
  const buttonBlock = pricingTable.slice(pricingTable.indexOf("<ButtonLink"), pricingTable.indexOf("</ButtonLink>"));
  assert.match(buttonBlock, /href=\{[^]*?period=\$\{annual \? "annual" : "monthly"\}[^]*?\}/);
  assert.match(buttonBlock, /"Get Started"/);
  assert.equal((buttonBlock.match(/Get Started|Start Free/g) || []).length, 1, "the label must be a single static expression, not conditional on period");
});
test("7-8: Enterprise remains Contact Sales and non-self-service", () => {
  assert.match(pricingTable, /plan\.name === "Enterprise"\s*\n\s*\? "\/contact\?intent=sales"/);
  assert.match(pricingTable, /\{plan\.name === "Enterprise" \? "Contact Sales" : "Get Started"\}/);
  const { commercialPricingPlans } = load("features/platform/commercial-pricing.ts");
  const enterprise = commercialPricingPlans.find((plan) => plan.code === "enterprise");
  assert.equal(enterprise.selfService, false);
});
test("9-10: the selected plan and period query parameters survive the copy change untouched", () => {
  assert.match(pricingTable, /\/signup\?plan=\$\{plan\.code\}&period=\$\{annual \? "annual" : "monthly"\}/);
});
test("11: generic (non-plan-specific) signup CTAs are intentionally unchanged", () => {
  assert.match(marketingShell, /Start Free/);
  assert.match(homepage, /Start Free Trial/);
});
test("12: existing-subscriber Upgrade copy/behavior is unchanged by this pass", () => {
  assert.match(commercialPlatform, /action === "upgrade" \? <Button className="w-full" variant="primary" disabled=\{busy !== null\} onClick=\{\(\) => changePlan\(displayPlan\.code\)\}>\{busy === displayPlan\.code \? "Updating plan\.\.\." : "Upgrade to " \+ displayPlan\.name\}<\/Button>/);
  assert.match(commercialPlatform, /action === "current" \? <p className="text-sm font-medium text-vds-muted" aria-current="true">Current Plan<\/p>/);
});
test("13: downgrade-safety wording and mechanism are unchanged by this pass", () => {
  assert.match(commercialPlatform, /Downgrades are managed separately\./);
  assert.match(commercialPlatform, /Contact support to change to a lower plan\./);
  assert.match(subscriptionManagement, /Downgrades are managed separately\. Contact support to change to a lower plan\./);
  assert.match(subscriptionManagement, /That plan change is not available here\. Contact support to downgrade\./);
});
test("14: no automatic checkout was introduced -- the plan card is still a plain navigation link, not a click handler", () => {
  const start = pricingTable.indexOf("<ButtonLink");
  const planCardLink = pricingTable.slice(start, pricingTable.indexOf("</ButtonLink>", start) + "</ButtonLink>".length);
  assert.match(planCardLink, /href=/);
  assert.doesNotMatch(planCardLink, /onClick/);
  assert.doesNotMatch(planCardLink, /fetch\(/);
  assert.doesNotMatch(pricingTable, /fetch\(/, "the pricing table must never call an API directly");
});
test("comparison table Included/Not-included cells expose meaningful text to screen readers, not a bare icon or hyphen", () => {
  const start = pricingTable.indexOf("function value(");
  const valueFn = pricingTable.slice(start);
  assert.match(valueFn, /<Check aria-hidden="true" className="size-4" \/>\s*\n\s*Included/, "the decorative checkmark must be aria-hidden so only the visible 'Included' text is announced");
  assert.match(valueFn, /<span aria-hidden="true">-<\/span>/, "the visible hyphen glyph must be hidden from assistive tech");
  assert.match(valueFn, /<span className="sr-only">Not included<\/span>/, "a screen-reader-only 'Not included' label must replace the bare hyphen");
  assert.doesNotMatch(pricingTable, /<Check className="size-4" \/>/, "no remaining non-hidden Check icon should exist in the comparison table");
});
test("15: no package price changed", () => {
  assert.match(commercialPricing, /code: "starter".*standardMonthlyPrice: 79/);
  assert.match(commercialPricing, /code: "professional".*standardMonthlyPrice: 149/);
  assert.match(commercialPricing, /code: "business".*standardMonthlyPrice: 399/);
  assert.match(commercialPricing, /code: "business_plus".*standardMonthlyPrice: 799/);
  assert.match(commercialPricing, /code: "enterprise".*standardMonthlyPrice: null/);
  assert.match(pricingTable, /Limited to the first \{plan\.promotion\?\.limitAgencies\} eligible agencies\. Professional is \$79\/month for \{plan\.promotion\?\.durationMonths\} successful monthly billing periods instead of the standard \$149\/month\./);
});
