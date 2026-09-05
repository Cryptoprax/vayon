import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(path)=>fs.readFileSync(path,"utf8");

test("onboarding has no CRM import step and completes at dashboard",()=>{const wizard=read("features/onboarding/components/EnterpriseOnboardingWizard.tsx"),domain=read("features/onboarding/domain/enterprise-onboarding.ts"),actions=read("features/onboarding/actions/onboarding.actions.ts")+read("features/onboarding/actions/enterprise-onboarding.actions.ts");assert.doesNotMatch(wizard,/CRM Import|CrmImportRecovery/);assert.doesNotMatch(domain,/Import CRM Data|crm: 9/);assert.match(actions,/\/vayon\/dashboard\?welcome=1/)});
test("data import reuses CSV validation and disables future connectors",()=>{const page=read("features/onboarding/components/DataImportWorkspace.tsx");assert.match(page,/OnboardingCsvImportService/);for(const provider of ["HubSpot","Salesforce","Zoho","Pipedrive"])assert.ok(page.includes(provider));assert.match(page,/Coming Soon/);assert.match(page,/disabled/)});
test("dashboard exposes the required Getting Started checklist",()=>{const checklist=read("features/vayon/dashboard/components/GettingStartedChecklist.tsx"),dashboard=read("features/vayon/dashboard/components/DashboardShell.tsx");for(const item of ["Complete Company Profile","Add First Property","Add First Lead","Invite Team","Connect WhatsApp (Optional)","Import Contacts (Optional)"])assert.ok(checklist.includes(item));assert.match(dashboard,/<GettingStartedChecklist data={data} \/>/)});
