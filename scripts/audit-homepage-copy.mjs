import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [homepage, pricing, config] = await Promise.all([
  read("features/marketing/components/Homepage.tsx"),
  read("features/marketing/components/PricingTable.tsx"),
  read("features/marketing/config/marketing.config.ts"),
]);
const publicCopy = `${homepage}\n${pricing}`;
for (const term of ["authoritative", "projection", "placeholder", "runtime", "provider", "governed", "internal", "evaluation", "pending verification", "customer approval", "subscription systems", "repository", "entitlements"]) {
  assert.equal(new RegExp(term, "i").test(publicCopy), false, `Homepage still contains internal term: ${term}`);
}
assert.match(homepage, /hasCustomerTestimonials = false/);
assert.match(homepage, /Why Real Estate Teams Choose VAYON/);
assert.match(homepage, /Founding Customer Offer/);
assert.match(pricing, /FOUNDING MEMBER PRICING/);
assert.match(pricing, /Prices shown in USD\. Monthly and annual plans available\./);
assert.match(config, /FOUNDING_MEMBER_SPOTS_REMAINING = 20/);
assert.match(config, /FOUNDING_MEMBER_ENABLED = true/);
console.log("Homepage copy audit passed: commercial copy is customer-focused and the founding offer is centrally configured.");
