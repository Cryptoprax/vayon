import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const migration = await read("supabase/migrations/20260926000000_sprint194_real_estate_crm_automation.sql");

test("property matching is deterministic, evidence-backed, isolated, and automatically refreshed", () => {
  for (const factor of ["budget_score", "location_score", "bedroom_score", "property_type_score", "availability_score", "investment_score", "rental_score", "lifestyle_score"]) {
    assert.match(migration, new RegExp(factor));
  }
  assert.match(migration, /unique\(lead_id,property_id\)/);
  assert.match(migration, /p\.organization_id=l\.organization_id and p\.workspace_id=l\.workspace_id/);
  assert.match(migration, /refresh_crm_recommendations_lead after insert or update/);
  assert.match(migration, /refresh_crm_recommendations_property after insert or update/);
});

test("pipeline automation uses the exact governed stages and preserves terminal states", () => {
  for (const stage of ["new", "contacted", "qualified", "interested", "site_visit", "negotiation", "offer", "won", "lost"]) {
    assert.match(migration, new RegExp(`'${stage}'`));
  }
  assert.match(migration, /pipeline_stage not in\('won','lost'\)/);
  assert.match(migration, /next_recommended_action/);
  assert.match(migration, /follow_up_due_at/);
});

test("duplicate protection is tenant scoped and presents actionable messages", async () => {
  assert.match(migration, /l\.organization_id=new\.organization_id and l\.workspace_id=new\.workspace_id/);
  assert.match(migration, /c\.organization_id=new\.organization_id and c\.workspace_id=new\.workspace_id/);
  assert.match(migration, /DUPLICATE_LEAD_DETECTED/);
  assert.match(migration, /DUPLICATE_COMPANY_DETECTED/);
  assert.match(await read("features/vayon/lead/actions/lead.actions.ts"), /Open the existing lead/);
  assert.match(await read("features/vayon/crm-company/actions.ts"), /Open the existing company/);
});

test("lead, contact, company, property, and command-center views expose live CRM projections", async () => {
  assert.match(await read("features/vayon/crm-engine/components/CrmLeadProfile.tsx"), /PropertyRecommendations/);
  assert.match(await read("app/vayon/crm/contacts/[contactId]/page.tsx"), /CrmLeadProfileView/);
  assert.match(await read("app/vayon/crm/companies/[companyId]/page.tsx"), /CompanyMetrics/);
  assert.match(await read("app/vayon/properties/[propertyId]/page.tsx"), /PropertyCrmSummary/);
  assert.match(await read("app/vayon/crm/page.tsx"), /SalesAutomationSummary/);
});

test("new CRM summaries use accessible landmarks and responsive grids", async () => {
  const sales = await read("features/vayon/crm-automation/SalesAutomationSummary.tsx");
  const property = await read("features/vayon/crm-automation/PropertyCrmSummary.tsx");
  assert.match(sales, /aria-labelledby/);
  assert.match(sales, /sm:grid-cols-2/);
  assert.match(property, /aria-labelledby/);
  assert.match(property, /sm:grid-cols-2/);
});
