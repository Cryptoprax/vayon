import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const page = read("app/vayon/settings/billing/page.tsx");
const ui = read("features/vayon/billing/components/CommercialPlatform.tsx");
const catalog = read("features/vayon/billing/providers/paddle/paddle-catalog.ts");
const route = read("app/api/billing/paddle/checkout/route.ts");

test("checkout CTA is available from server configuration even when catalog display reads are unavailable", () => {
  assert.match(page, /checkoutEnabled=\{Boolean\(snapshot\.canManage && snapshot\.provider\.missing\.length === 0\)\}/);
  assert.match(ui, /checkoutEnabled && clientToken && !subscribed/);
  assert.doesNotMatch(ui, /catalog\.find/);
  for (const name of ["Starter", "Professional", "Business", "Business Plus"]) assert.match(ui, new RegExp(`Choose " \\+ displayPlan\\.name|${name}`));
});

test("every client selection remains a plan and interval, never a Paddle identifier", () => {
  assert.match(catalog, /PADDLE_PRODUCT_\$\{plan\.toUpperCase\(\)\}/);
  assert.match(catalog, /PADDLE_PRICE_\$\{suffix\}/);
  assert.match(ui, /planCode: plan, billingPeriod: period/);
  assert.match(route, /isPaddlePlanCode/);
  assert.doesNotMatch(ui, /\b(?:pri|pro)_[a-z0-9]+\b/i);
});

test("Professional header stacks its promotion badge instead of shrinking the title", () => {
  assert.match(ui, /flex flex-col gap-3/);
  assert.match(ui, /min-w-0/);
  assert.match(ui, /self-start rounded-full/);
  assert.match(ui, /flex h-full flex-col/);
  assert.match(ui, /mt-auto pt-2/);
});
