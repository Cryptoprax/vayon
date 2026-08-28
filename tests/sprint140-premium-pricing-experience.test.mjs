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
    "Start Free",
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
    '"SLA"',
  ])
    assert.ok(source.includes(evidence), evidence);
});

test("sales narrative includes plan guidance, comparisons and FAQ", () => {
  const source = pricing();
  for (const evidence of [
    "Which plan is right for you?",
    "Perfect for independent agents and small real estate teams.",
    "Recommended for growing teams.",
    "Built for companies operating across multiple locations.",
    "Still not sure?",
    "Book a free strategy call",
    "Book a Demo",
    "Talk to Sales",
    "Why VAYON Saves You Money",
    "Software Category",
    "Typical Monthly Cost",
    "$355–1,380+/month",
    "Enterprise comparison",
    "Commercial questions, answered.",
  ])
    assert.ok(source.includes(evidence), evidence);
  for (const removed of [
    "Why Businesses Choose VAYON",
    "Return on investment",
    "Ready to run your business with AI?",
    "Designed around your security, scale and operating model.",
  ])
    assert.ok(!source.includes(removed), removed);
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
