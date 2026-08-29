import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("executive dashboard exposes every real estate KPI without fallback values", () => {
  const catalog = read("features/vayon/real-estate-experience/catalog.ts");
  const grid = read("features/vayon/dashboard/components/RealEstateKpiGrid.tsx");
  for (const value of ["New Leads", "Active Buyers", "Active Sellers", "Active Listings", "Properties Sold", "Properties Rented", "Pending Offers", "Today's Site Visits", "Today's Meetings", "Expected Revenue", "Commission Earned", "Monthly Closings", "Lead Conversion", "Agent Productivity", "Average Closing Time", "Customer Satisfaction"]) assert.match(catalog, new RegExp(value));
  assert.match(grid, /Unavailable/);
  assert.match(grid, /Awaiting verified workspace data/);
});

test("assistant is real estate specific and remains approval first", () => {
  const catalog = read("features/vayon/real-estate-experience/catalog.ts");
  const assistant = read("features/vayon/intelligence-core/components/VayonIntelligence.tsx");
  for (const action of ["Find matching properties", "Find matching buyers", "Generate luxury property description", "Generate WhatsApp follow-up", "Schedule site visit", "Estimate property valuation", "Generate brochure", "Draft offer letter", "Generate agreement draft"]) assert.match(catalog, new RegExp(action));
  assert.match(assistant, /Real Estate Assistant/);
  assert.match(assistant, /executed autonomously/);
});

test("property and lead profiles expose evidence-safe intelligence surfaces", () => {
  const catalog = read("features/vayon/real-estate-experience/catalog.ts");
  const property = read("app/vayon/properties/[propertyId]/page.tsx");
  const lead = read("app/vayon/leads/[leadId]/page.tsx");
  for (const field of ["AI Listing Score", "Demand Score", "Pricing Competitiveness", "Buyer Match Count", "Nearby Market Trends", "Recommended Price", "Buyer/Seller type", "Preferred communities", "Mortgage required", "AI Buying Intent", "Interaction Timeline"]) assert.match(catalog, new RegExp(field.replace("/", "\\/")));
  assert.match(property, /RealEstateSignalGrid kind="property"/);
  assert.match(lead, /RealEstateSignalGrid kind="lead"/);
});

test("transactions calendar marketing reports and search use real estate language", () => {
  const catalog = read("features/vayon/real-estate-experience/catalog.ts");
  const transactions = read("app/vayon/deals/page.tsx");
  const calendar = read("features/vayon/calendar-platform/components/CalendarViews.tsx");
  const search = read("features/vayon/universal-bar/providers/static-navigation.provider.ts");
  for (const value of ["Viewing Scheduled", "Offer Accepted", "Loan Processing", "Legal Verification", "Registration", "Handover", "Open House", "Virtual Tour", "Luxury Brochure", "Commission Report", "Viewing Analytics", "Closing Analytics"]) assert.match(catalog, new RegExp(value));
  assert.match(transactions, /Transaction Center/);
  assert.match(calendar, /calendarCategories/);
  assert.match(search, /realEstatePriority/);
});

test("priority empty states provide primary and secondary actions", () => {
  const leads = read("app/vayon/leads/page.tsx");
  const properties = read("features/vayon/property-platform/components/PropertyViews.tsx");
  const transactions = read("app/vayon/deals/page.tsx");
  assert.match(leads, /No Leads/);
  assert.match(leads, /Connect Meta Lead Ads or import leads/);
  assert.match(properties, /No Properties Yet/);
  assert.match(properties, /begin receiving buyer enquiries/);
  assert.match(transactions, /No Transactions/);
  for (const source of [leads, properties, transactions]) assert.ok((source.match(/ButtonLink/g) ?? []).length >= 2);
});
