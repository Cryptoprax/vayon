import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");

test("Real Estate Growth Center is a first-class sidebar module", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  assert.match(navigation, /label: "Growth Center"/);
  for (const route of ["lead-generation", "listing-performance", "buyer-intelligence", "seller-intelligence", "marketing-analytics", "advertising-performance", "social-performance", "property-seo", "referral-network", "market-intelligence", "reports"]) assert.match(navigation, new RegExp(`/vayon/growth/${route}`));
  assert.ok(existsSync(new URL("app/vayon/growth/[section]/page.tsx", root)));
});

test("real estate overview is evidence-safe and every surface offers a next action", () => {
  const overview = read("features/vayon/growth-intelligence/GrowthOverview.tsx");
  for (const surface of ["New Leads", "Active Buyers", "New Sellers", "Properties Listed", "Properties Sold", "Properties Rented", "Conversion Rate", "Revenue", "Commission", "Today's Viewings", "Upcoming Appointments", "Pending Offers", "Hot Leads", "Cold Leads", "Agent Performance"]) assert.match(overview, new RegExp(surface));
  assert.match(overview, /No verified workspace data is available/);
  assert.match(overview, /ButtonLink/);
  assert.doesNotMatch(overview, /\$\d|\d+%|followers|impressions:\s*\d/i);
});

test("AI CMO prepares recommendations and preserves human approval", () => {
  const cmo = read("features/vayon/growth-intelligence/StrategyWorkspace.tsx");
  assert.match(cmo, /Strategy Generator/);
  assert.match(cmo, /Nothing executes automatically/);
  assert.match(cmo, /Add to review queue/);
  assert.match(cmo, /disabled={!goal.trim\(\) \|\| !audience.trim\(\)}/);
  assert.doesNotMatch(cmo, /fetch\(|\/api\//);
});

test("real estate growth catalogs are complete and founder catalogs remain available", () => {
  const catalog = read("features/vayon/growth-intelligence/catalog.ts");
  for (const value of ["Meta Ads", "Properties Without Enquiries", "Budget Distribution", "Valuation Requests", "Revenue Attribution", "Return On Ad Spend", "Neighborhood Heatmaps", "Referral Revenue"]) assert.match(catalog, new RegExp(value));
  for (const founderValue of ["Brand Assets", "Podcast Outreach", "Discord", "Due diligence checklist"]) assert.match(catalog, new RegExp(founderValue));
});
