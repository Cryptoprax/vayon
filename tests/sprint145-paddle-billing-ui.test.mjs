import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const billingPage = read("app/vayon/settings/billing/page.tsx");
const billingUi = read(
  "features/vayon/billing/components/CommercialPlatform.tsx",
);
const catalogService = read(
  "features/vayon/billing/services/paddle-catalog.service.ts",
);
const legacyCatalog = read(
  "features/vayon/billing/config/commercial-plans.ts",
);

test("billing prices are loaded from environment-backed Paddle catalog entries", () => {
  assert.match(billingPage, /PaddleCatalogService/);
  assert.match(billingPage, /\.list\(\)/);
  assert.match(catalogService, /paddlePlanCodes/);
  assert.match(catalogService, /paddleRequest<PaddlePrice>/);
  assert.match(catalogService, /\/prices\//);
  assert.match(catalogService, /include=product/);
  assert.doesNotMatch(billingUi + legacyCatalog, /\b59\b|\b179\b|\b399\b/);
  assert.doesNotMatch(legacyCatalog, /monthlyUsd|annualUsd/);
});

test("monthly and annual selections use their matching Paddle prices", () => {
  assert.match(billingUi, /useState<"monthly" \| "annual">/);
  assert.match(billingUi, /item\.period === billingPeriod/);
  assert.match(billingUi, /setBillingPeriod\("monthly"\)/);
  assert.match(billingUi, /setBillingPeriod\("annual"\)/);
  assert.match(billingUi, /displayPrice\(price\.amount, price\.currencyCode\)/);
});

test("all commercial cards post the existing checkout contract and redirect", () => {
  for (const plan of [
    "starter",
    "professional",
    "business",
    "business_plus",
  ])
    assert.match(billingUi, new RegExp(`"${plan}"`));
  for (const field of [
    "organizationId",
    "workspaceId",
    "plan",
    "billingPeriod",
    "quantity",
    "planCode",
    "seatQuantity",
  ])
    assert.match(billingUi, new RegExp(field));
  assert.match(billingUi, /fetch\("\/api\/billing\/paddle\/checkout"/);
  assert.match(billingUi, /window\.location\.assign\(result\.url\)/);
  assert.match(billingUi, /onClick=\{\(\) => checkout\(plan\)\}/);
});

test("Enterprise remains a Contact Sales flow", () => {
  assert.match(billingUi, /href="\/contact"/);
  assert.match(billingUi, /Contact Sales/);
});
