import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Emma dashboard exposes evidence-safe real estate marketing intelligence", async () => {
  const source = await read("features/platform/marketing-ai/components/EmmaMarketingManagerDashboard.tsx");
  for (const label of ["Today&apos;s Marketing Brief", "Campaign Performance", "Listings Needing Promotion", "Listings With Low Engagement", "Best Performing Listings", "Properties With Zero Enquiries", "Marketing Opportunities", "Urgent Marketing Tasks"])
    assert.match(source, new RegExp(label));
  for (const label of ["Photo Quality", "Description Quality", "Headline Quality", "Missing Information", "Pricing Presentation", "Feature Completeness", "CTA Quality", "Overall Marketing Score"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Evidence:/);
  assert.match(source, /Unavailable — property or campaign performance evidence is not connected/);
});

test("Emma prepares the complete governed campaign content and brochure catalog", async () => {
  const source = await read("features/platform/marketing-ai/components/EmmaMarketingManagerDashboard.tsx");
  for (const label of ["Facebook Campaign", "Instagram Campaign", "Google Ads", "WhatsApp Campaign", "Email Campaign", "Referral Campaign", "Open House Campaign", "Luxury Property Campaign", "Rental Campaign", "Instagram Caption", "LinkedIn Post", "Property Reel Script", "Listing Headline", "Luxury Version", "Commercial Version", "Luxury Brochure", "Buyer Brochure", "Seller Brochure", "Investment Summary", "Open House Flyer", "QR Flyer"])
    assert.match(source, new RegExp(label));
  assert.match(source, /\/vayon\/approvals\?intent=/);
  assert.doesNotMatch(source, /onClick|setInterval|fetch\(/);
});

test("Emma reuses one existing Marketing AI dashboard projection", async () => {
  const page = await read("app/vayon/ai/workforce/[employeeId]/page.tsx");
  assert.match(page, /EmmaMarketingManagerDashboard/);
  assert.match(page, /employee === "marketing-ai" \|\| employee === "crm-ai"/);
  assert.equal((page.match(/MarketingAIService\.production\(\)/g) ?? []).length, 1);
});
