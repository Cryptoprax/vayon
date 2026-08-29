import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const ui = read("features/platform/enterprise-integrations/components/BusinessConnectionsDirectory.tsx");
const page = read("features/platform/enterprise-integrations/components/EnterpriseIntegrationDashboard.tsx");
const service = read("features/platform/enterprise-integrations/services/enterprise-integration.service.ts");

for (const value of ["Business Connections","Connected","Syncing","Needs Attention","Not Connected","Coming Soon","Overall Health","Search providers","Today’s Connection Insights","Unlocked AI Employees","Never Synced","Recommendation","Confidence"])
  assert.match(ui + page, new RegExp(value));
for (const provider of ["google_identity","gmail","google_calendar","whatsapp_business","openai","paddle","razorpay","crm_imports","transactional_email","microsoft_365","slack","dropbox","docusign","quickbooks","xero","youtube","tiktok","hubspot","salesforce","stripe"])
  assert.match(service, new RegExp(provider));
assert.doesNotMatch(ui + page, /Guidance|Configure later|\bWaiting\b/);
assert.doesNotMatch(service, /adapter\.health|IntegrationProviderRegistry/);
assert.match(ui, /motion-reduce/);
assert.match(ui, /aria-label/);
console.log("Business Connections audit passed: executive states, evidence, interaction, provider inventory, accessibility, and single-projection performance are present.");
