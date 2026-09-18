import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const ui = read("features/vayon/billing/components/CommercialPlatform.tsx");
test("billing comparison consumes the shared commercial catalog (including Enterprise) and matching billing periods", () => {
  const pricing = read("features/platform/commercial-pricing.ts");
  for (const plan of ["starter", "professional", "business", "business_plus", "enterprise"]) assert.match(pricing, new RegExp(`code: "${plan}"`));
  // Plan-aware availability now flows through the canonical resolvePlanAction
  // helper rather than a single boolean subscribed flag.
  assert.match(ui, /resolvePlanAction\(/);
  assert.doesNotMatch(ui, /mappedPrice/);
  assert.match(ui, /setPeriod\(value\)/);
  assert.match(ui, /aria-pressed=\{period === value\}/);
});
test("checkout starts the existing workspace-scoped transaction in an overlay", () => {
  assert.match(ui, /fetch\("\/api\/billing\/paddle\/checkout"/);
  assert.match(ui, /planCode: plan, billingPeriod: period, seatQuantity: 1/);
  assert.match(ui, /openCheckoutOverlay\(result\.transactionId/);
  assert.match(ui, /Preparing checkout/);
  assert.match(ui, /Choose " \+ displayPlan\.name/);
  // Self-service checkout itself never navigates away; the one permitted
  // "/contact" reference is Enterprise's non-self-service Contact Sales link,
  // gated strictly behind the "contact" action kind (see the next test).
  assert.doesNotMatch(ui, /window\.location|href="\/pricing"/);
});
test("Enterprise is always Contact Sales and can never reach self-service checkout or plan-change", () => {
  assert.match(ui, /action === "contact" \? <ButtonLink[^>]*href="\/contact\?intent=sales"/);
  // The only place "enterprise" the plan code appears is inside resolvePlanAction's
  // canonical, tested "contact" branch -- never inside checkout()/changePlan() calls.
  assert.doesNotMatch(ui, /checkout\(["'`]enterprise/);
  assert.doesNotMatch(ui, /changePlan\(["'`]enterprise/);
});
