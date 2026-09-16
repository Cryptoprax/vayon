import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const config = read("features/platform/commercial-pricing.ts");
const publicPricing = read("features/marketing/components/PricingTable.tsx");
const billing = read("features/vayon/billing/components/CommercialPlatform.tsx");

test("one canonical commercial source defines every approved display price", () => {
  for (const evidence of ['standardMonthlyPrice: 79', 'standardMonthlyPrice: 149', 'promotionalMonthlyPrice: 79', 'limitAgencies: FOUNDING_MEMBER_SPOTS_REMAINING', 'durationMonths: 12', 'standardMonthlyPrice: 399', 'standardMonthlyPrice: 799', 'standardMonthlyPrice: null', 'ANNUAL_SAVINGS_PERCENT = 20']) assert.match(config, new RegExp(evidence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(publicPricing, /commercialPricingPlans/);
  assert.match(billing, /selfServiceCommercialPlans/);
});

test("Professional presents its standard value and founding offer without inventing an annual promotion", () => {
  for (const source of [publicPricing, billing]) { assert.match(source, /line-through/); assert.match(source, /FOUNDING MEMBER PRICING/); assert.match(source, /Limited to the first/); }
  assert.match(config, /durationMonths: 12/);
  assert.match(billing, /Annual pricing uses the standard plan rate/);
  assert.match(config, /period === "monthly" && plan\.promotion\?\.enabled/);
  assert.match(config, /commercialAnnualMonthlyPrice/);
});

test("authenticated display pricing is independent from Paddle checkout mapping", () => {
  assert.match(billing, /commercialDisplayPrice/);
  assert.match(billing, /checkoutAvailable/);
  assert.doesNotMatch(`${billing}\n${config}`, /\b(?:pro|pri)_[a-z0-9]+\b/i);
  assert.match(billing, /fetch\("\/api\/billing\/paddle\/checkout"/);
  assert.doesNotMatch(billing, /enterprise/);
});


test("pricing presentation is UTF-8 safe and renders feature icons separately from commercial data", () => {
  for (const source of [config, publicPricing, billing]) {
    assert.doesNotMatch(source, /â|ï¿½|�/);
  }
  assert.match(publicPricing, /Annual \{"\\u00B7"\} save \{ANNUAL_SAVINGS_PERCENT\}%/);
  assert.match(billing, /Annual \{"\\u00B7"\} save 20%/);
  assert.match(publicPricing, /<Check aria-hidden="true"/);
  assert.match(publicPricing, /\{plan\.seats\} team members/);
  assert.doesNotMatch(config, /✓|âœ/);
});
