import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("property cards expose commercial real estate decision signals without fabricated values", async () => {
  const source = await read("features/vayon/property/components/PropertyCard.tsx");
  for (const label of ["Bedrooms", "Bathrooms", "Area", "AI listing score", "Demand score", "Interested buyers", "Viewing requests", "Days on market"]) assert.match(source, new RegExp(label, "i"));
  assert.match(source, /Unavailable/);
  assert.match(source, /Open property command center/);
});

test("client and transaction command centers use real estate language", async () => {
  const [client, transaction] = await Promise.all([
    read("features/vayon/crm-engine/components/CrmLeadProfile.tsx"),
    read("features/vayon/deal/components/DealWorkspaceContent.tsx"),
  ]);
  for (const label of ["Intent Score", "Urgency Score", "Budget Confidence", "Mortgage Status", "Property Matches", "AI Next Best Action"]) assert.match(client, new RegExp(label));
  for (const label of ["Transaction Progress", "Buyer", "Seller", "Commission", "Loan Status", "Registration Status", "Risk Level"]) assert.match(transaction, new RegExp(label));
});

test("sales copilot presents the approved commercial action set", async () => {
  const source = await read("features/vayon/real-estate-experience/catalog.ts");
  for (const action of ["Recommend Property", "Generate WhatsApp Reply", "Summarize Meeting", "Prepare Brochure", "Schedule Viewing", "Generate Agreement"]) assert.match(source, new RegExp(action));
});

test("global search groups real estate results and preserves keyboard access", async () => {
  const source = await read("features/vayon/universal-bar/components/UniversalBar.tsx");
  for (const group of ["Properties", "Clients", "Leads", "Agents", "Builders & Developers", "Transactions", "Documents"]) assert.match(source, new RegExp(group));
  assert.match(source, /Control\+K Meta\+K/);
  assert.match(source, /recently-searched/);
});

test("premium empty and loading states include AI guidance and reduced motion", async () => {
  const [empty, loading] = await Promise.all([
    read("features/vayon/components/SmartEmptyState.tsx"),
    read("features/vayon/components/RouteStates.tsx"),
  ]);
  assert.match(empty, /AI suggestion:/);
  assert.match(loading, /motion-reduce:animate-none/);
  assert.match(loading, /loading progressively/);
});
