import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const pricing = () => read("features/marketing/components/PricingTable.tsx");

test("pricing starts with simple plan selection and omits duplicated marketing", () => {
  const source = pricing();
  for (const evidence of [
    "Simple pricing",
    "Choose the plan that fits your business.",
    "Start Free Trial",
    "Annual · save 20%",
    "Monthly",
  ])
    assert.ok(source.includes(evidence), evidence);
  assert.doesNotMatch(source, /The World&apos;s First AI Business Operating System/);
  assert.doesNotMatch(source, /Flagship products/);
  assert.doesNotMatch(source, /Business outcomes/);
});

test("commercial packages and comparison matrix cover the Sprint 140 offer", () => {
  const source = pricing();
  for (const evidence of [
    'name: "Starter",\n    price: 79',
    'name: "Professional",\n    price: 149',
    'name: "Business",\n    price: 399',
    'name: "Business Plus",\n    price: 799',
    'name: "Enterprise",\n    price: null',
    "MOST POPULAR",
    "Annual · save 20%",
    "Dedicated Success Manager",
    "Private Cloud",
    "Custom Integrations",
    "Enterprise SLA",
  ])
    assert.ok(source.includes(evidence), evidence);
});

test("sales narrative includes cost comparison ROI enterprise FAQ and final conversion", () => {
  const source = pricing();
  for (const evidence of [
    "Why VAYON Saves You Money",
    "Software Category",
    "Typical Monthly Cost",
    "$355–1,380+/month",
    "Why Businesses Choose VAYON",
    "Lower software costs",
    "AI employees included",
    "Estimated monthly software spend",
    "Savings vary depending on your existing software stack.",
    "Commercial questions, answered.",
    "Ready to run your business with AI?",
    "Talk to Sales",
    "plan-popularity upgrade-funnel conversion-funnel trial-conversion mrr-projection arr-projection",
    "no metrics are fabricated",
  ])
    assert.ok(source.includes(evidence), evidence);
});

test("pricing remains presentation-only and does not bypass commercial authorities", () => {
  const source = pricing();
  assert.doesNotMatch(source, /from ["'][^"']*(stripe|entitlement)/i);
  assert.doesNotMatch(source, /checkoutSession|createCheckout/);
  assert.match(source, /existing Subscription and Stripe systems/);
  const page = read("features/marketing/components/MarketingPage.tsx");
  assert.match(page, /content\.id === "pricing"/);
  assert.match(page, /<PricingTable \/>/);
});
