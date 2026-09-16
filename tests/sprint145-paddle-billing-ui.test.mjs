import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const ui = read("features/vayon/billing/components/CommercialPlatform.tsx");
test("billing comparison consumes the four-plan shared commercial catalog and matching billing periods", () => {
  const pricing = read("features/platform/commercial-pricing.ts");
  for (const plan of ["starter", "professional", "business", "business_plus"]) assert.match(pricing, new RegExp(`code: "${plan}"`));
  assert.doesNotMatch(ui, /enterprise/);
  assert.match(ui, /item\.period === period/);
  assert.match(ui, /setPeriod\(value\)/);
  assert.match(ui, /aria-pressed=\{period === value\}/);
});
test("checkout starts the existing workspace-scoped transaction in an overlay", () => {
  assert.match(ui, /fetch\("\/api\/billing\/paddle\/checkout"/);
  assert.match(ui, /planCode: plan, billingPeriod: period, seatQuantity: 1/);
  assert.match(ui, /openCheckoutOverlay\(result\.transactionId/);
  assert.doesNotMatch(ui, /window\.location|href="\/(pricing|contact)"/);
});
test("self-service checkout does not offer Enterprise or leave the workspace", () => {
  assert.doesNotMatch(ui, /enterprise/);
  assert.doesNotMatch(ui, /href="\/contact"/);
});
