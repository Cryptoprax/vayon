import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const pricing = () => read("features/marketing/components/PricingTable.tsx");

test("pricing hero and flagship catalog communicate the unified platform", () => {
  const source = pricing();
  for (const evidence of [
    "The World&apos;s First AI Business Operating System",
    "Start Free Trial",
    "Book a Demo",
    "AI Business Launch",
    "AI Workforce",
    "AI CRM",
    "Creative Studio 2.0",
    "Brand Studio",
    "Document Studio",
    "Image Studio",
    "Video Studio",
    "Campaign Studio",
    "Marketing Studio",
    "Sales Workspace",
    "Customer Success",
    "Founder OS",
    "Business Intelligence",
  ])
    assert.ok(source.includes(evidence), evidence);
  assert.match(
    source,
    /Everything your business needs\. One intelligent platform powered by\s+AI\./,
  );
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

test("sales narrative includes outcomes ROI enterprise FAQ and final conversion", () => {
  const source = pricing();
  for (const evidence of [
    "Business outcomes",
    "Launch your business with AI",
    "Generate sales proposals",
    "Create investor pitch decks",
    "Estimated monthly software spend",
    "Estimated savings with VAYON",
    "Why businesses choose VAYON",
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
