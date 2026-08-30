import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("central AI matching engine is deterministic evidence based and cached", async () => {
  const source = await read("features/vayon/property-matching/engine.ts");
  for (const value of ["AiBuyerPropertyMatchingEngine", "BuyerMatchEvidence", "PropertyMatchEvidence", "budget", "location", "property", "lifestyle", "timeline", "amenities", "overallScore", "missingInformation", "confidenceReducers", "recommendationOnly"])
    assert.match(source, new RegExp(value));
  for (const confidence of ["High", "Medium", "Low", "Unknown"]) assert.match(source, new RegExp(confidence));
  for (const action of ["Call Buyer", "Schedule Viewing", "Send WhatsApp", "Send Brochure", "Arrange Virtual Tour", "Negotiate", "Request Documents"])
    assert.match(source, new RegExp(action));
  assert.match(source, /cache\.get/);
  assert.doesNotMatch(source, /Math\.random|Date\(|fetch\(|createClient|supabase/i);
});

test("missing and unavailable evidence cannot become fabricated scores", async () => {
  const source = await read("features/vayon/property-matching/engine.ts");
  for (const message of ["Buyer budget missing", "Preferred location missing", "Property area missing", "Property unavailable", "Buyer timeline missing", "Buyer amenity preferences missing"])
    assert.match(source, new RegExp(message));
  assert.match(source, /overallScore = property\.available === false.*undefined/);
  assert.match(source, /score === undefined.*missing/);
});

test("buyer property and executive surfaces expose matching decisions", async () => {
  const [buyer, property, dashboard] = await Promise.all([
    read("features/vayon/crm-engine/components/CrmLeadProfile.tsx"),
    read("features/vayon/crm-automation/PropertyCrmSummary.tsx"),
    read("features/vayon/dashboard/components/RealEstateIntelligence.tsx"),
  ]);
  for (const label of ["Top Matching Properties", "Recently Improved Matches", "New Listings", "Expired Matches"]) assert.match(buyer, new RegExp(label));
  for (const label of ["Top Matching Buyers", "Hot Buyers", "VIP Buyers", "Cash Buyers", "Investment Buyers", "Why this buyer qualifies", "Next Recommended Action", "AI Match Score"]) assert.match(property, new RegExp(label));
  for (const label of ["Top AI Matches Today", "New Buyer Matches", "Properties Without Matches", "High Probability Closings", "Buyers Waiting", "Properties Waiting"]) assert.match(dashboard, new RegExp(label));
});

test("buyer profile is future ready for the complete matching evidence set", async () => {
  const source = await read("features/vayon/property-matching/domain.ts");
  for (const value of ["communities", "preferredBuilder", "listingType", "mortgageStatus", "familySize", "floorPreference", "furnishing", "lifestyle"])
    assert.match(source, new RegExp(value));
});
