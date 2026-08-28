import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(path, "utf8");

test("landing page follows the final unique information architecture", () => {
  const source = read("features/marketing/components/Homepage.tsx");
  const order = ['eyebrow="Product demo"', "<Proof />", 'eyebrow="One real estate operating system"', 'eyebrow="Complete platform"', 'eyebrow="AI employees"', "<RealEstateBusinesses />", 'eyebrow="Business case"', "<Testimonials />", "<PricingTable />", 'eyebrow="Real Estate FAQ"', "Ready To Transform"];
  let previous = -1;
  for (const marker of order) {
    const current = source.indexOf(marker);
    assert.ok(current > previous, `${marker} must appear once in the expected order`);
    previous = current;
  }
});

test("landing page has one audience and AI employee presentation", () => {
  const source = read("features/marketing/components/Homepage.tsx");
  assert.equal(source.match(/Built Specifically For Real Estate/g)?.length, 1);
  assert.equal(source.match(/<AiTeamGrid \/>/g)?.length, 1);
  for (const removed of ["ConversionWorkforce", "PositioningContinuity", "Separate subscription", "Stop Paying For 15 Different Tools"])
    assert.doesNotMatch(source, new RegExp(removed));
});

test("public CTAs use the approved language", () => {
  const source = [read("features/marketing/components/Homepage.tsx"), read("features/marketing/components/MarketingShell.tsx"), read("features/marketing/components/PublicContentPage.tsx")].join("\n");
  for (const approved of ["Book Demo", "Watch 2 Minute Demo", "Start Free", "Contact Sales"])
    assert.match(source, new RegExp(approved));
  for (const retired of ["Book Real Estate Demo", "Watch Real Estate Demo", "Get started", "Talk To Sales"])
    assert.doesNotMatch(source, new RegExp(retired));
});
