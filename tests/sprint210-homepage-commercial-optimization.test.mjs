import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage hides unapproved testimonials and shows customer value", async () => {
  const source = await read("features/marketing/components/Homepage.tsx");
  assert.match(source, /hasCustomerTestimonials = false/);
  assert.match(source, /Why Real Estate Teams Choose VAYON/);
  assert.match(source, /Nothing executes automatically/);
  assert.doesNotMatch(source, /pending verification|customer approval|placeholder/i);
});

test("founding customer offer is configured once and presented in hero and pricing", async () => {
  const [config, homepage, pricing] = await Promise.all([
    read("features/marketing/config/marketing.config.ts"),
    read("features/marketing/components/Homepage.tsx"),
    read("features/marketing/components/PricingTable.tsx"),
  ]);
  assert.match(config, /FOUNDING_MEMBER_SPOTS_REMAINING = 20/);
  assert.match(config, /FOUNDING_MEMBER_ENABLED = true/);
  assert.match(homepage, /Founding Customer Offer/);
  assert.match(pricing, /FOUNDING MEMBER PRICING/);
});

test("pricing FAQ uses customer-facing support AI and retention answers", async () => {
  const source = await read("features/marketing/components/PricingTable.tsx");
  assert.match(source, /dedicated Customer Success Manager/);
  assert.match(source, /requires your approval before it happens/);
  assert.match(source, /during the retention period/);
  assert.doesNotMatch(source, /Stripe subscription lifecycle|entitlement engine|provider adapters|sales evaluation/);
});
