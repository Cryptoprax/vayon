import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const ui = read("features/vayon/billing/components/CommercialPlatform.tsx");
test("billing prices still come from the existing verified provider catalog", () => {
  const service = read("features/vayon/billing/services/paddle-catalog.service.ts");
  assert.match(service, /paddleRequest<PaddlePrice>/);
  assert.match(service, /include=product/);
  assert.match(read("app/vayon/settings/billing/page.tsx"), /catalog=\{snapshot.catalog\}/);
  assert.doesNotMatch(ui, /\b59\b|\b179\b|\b399\b/);
});
test("comparison offers Starter Professional Enterprise and matching billing periods", () => {
  for (const plan of ["starter", "professional", "enterprise"]) assert.match(ui, new RegExp(plan));
  assert.match(ui, /item.period === period/);
  assert.match(ui, /setPeriod\(value\)/);
  assert.match(ui, /aria-pressed=\{period === value\}/);
});
test("checkout starts the existing workspace-scoped transaction in an overlay", () => {
  assert.match(ui, /fetch\("\/api\/billing\/paddle\/checkout"/);
  assert.match(ui, /planCode: plan, billingPeriod: period, seatQuantity: 1/);
  assert.match(ui, /openCheckoutOverlay\(result.transactionId/);
  assert.doesNotMatch(ui, /window.location|href="\/(pricing|contact)"/);
});
test("Enterprise does not invent checkout prices or leave the workspace", () => {
  assert.match(ui, /Enterprise upgrades require an agreed contract/);
  assert.doesNotMatch(ui, /href="\/contact"/);
});
