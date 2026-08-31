import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("customer navigation uses real estate terminology and founder tools use protected routes", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  for (const label of ["Dashboard", "Properties", "Leads", "Clients", "Agencies / Builders", "Transactions", "Real Estate Approval Center", "Lead Generation", "Listing Performance", "Buyer Intelligence", "Seller Intelligence", "Property SEO", "Referral Network", "Market Intelligence", "AI Assistant"])
    assert.match(navigation, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const label of ["Workflow Designer", "Platform Analytics", "Investor Relations", "Platform Marketing", "Cross Industry Templates", "Product Intelligence", "AI Playground", "Feature Flags", "Enterprise Management", "Platform Settings"])
    assert.match(navigation, new RegExp(label));
});

test("growth catalog covers the real estate acquisition and intelligence surfaces", () => {
  const catalog = read("features/vayon/growth-intelligence/catalog.ts");
  for (const value of ["Meta Ads", "Cost Per Lead", "Properties Without Enquiries", "Budget Distribution", "Valuation Requests", "Revenue Attribution", "Return On Ad Spend", "Property Pages", "Mortgage Brokers", "Neighborhood Heatmaps", "Agent Performance"])
    assert.match(catalog, new RegExp(value));
  assert.match(catalog, /founderGrowthSections/);
  assert.match(catalog, /allGrowthSections/);
});

test("real estate overview is actionable without fabricated metrics", () => {
  const overview = read("features/vayon/growth-intelligence/GrowthOverview.tsx");
  for (const metric of ["New Leads", "Active Buyers", "New Sellers", "Properties Listed", "Properties Sold", "Properties Rented", "Conversion Rate", "Revenue", "Commission", "Today's Viewings", "Upcoming Appointments", "Pending Offers", "Hot Leads", "Cold Leads", "Agent Performance"])
    assert.match(overview, new RegExp(metric));
  assert.match(overview, />Unavailable</);
  assert.doesNotMatch(overview, /value:\s*["'`]?[0-9]/);
});

test("founder-only growth and platform routes are concealed centrally", () => {
  const policy = read("features/platform/visibility/policy.ts");
  for (const path of ["/platform", "/vayon/workflows", "/vayon/creative", "/vayon/growth/pr", "/vayon/growth/community", "/vayon/growth/influencers", "/vayon/growth/investor-relations", "/vayon/ai/playground"])
    assert.match(policy, new RegExp(path.replaceAll("/", "\\/")));
  assert.match(policy, /roles: founderRoles/);
});

test("approval center uses real estate decision language and evidence fields", () => {
  const page = read("app/vayon/approvals/page.tsx");
  const views = read("features/vayon/workflow-approval/components/GovernanceViews.tsx");
  for (const value of ["Real Estate Approval Center", "Publish Listing", "Price Revision", "Commission", "Offer Acceptance", "Agent Assignment", "Listing Removal", "Media Approval"])
    assert.match(page, new RegExp(value));
  for (const field of ["Requester", "Approver", "Reason", "Evidence & timeline"])
    assert.match(views, new RegExp(field));
});
