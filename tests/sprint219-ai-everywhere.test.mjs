import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
const actions = read("features/vayon/cross-module-intelligence/ContextualAIActions.tsx");

test("primary entities expose one shared contextual AI action surface",()=>{for(const kind of ["property","lead","client","company","dashboard"])assert.match(actions,new RegExp(`${kind}:`));for(const page of ["app/vayon/properties/[propertyId]/page.tsx","app/vayon/leads/[leadId]/page.tsx","app/vayon/crm/contacts/[contactId]/page.tsx","app/vayon/crm/companies/[companyId]/page.tsx","features/vayon/dashboard/components/DashboardShell.tsx"])assert.match(read(page),/ContextualAIActions/)});
test("property lead client and company actions cover specialist workflows",()=>{for(const label of ["Generate Brochure","Generate Property Video","Generate Open House Kit","Call Lead","Recommend Properties","Risk Analysis","Generate Property Portfolio","Referral Campaign","Generate Company Presentation","Expansion Report"])assert.match(actions,new RegExp(label))});
test("context propagation reuses the operating system router",()=>{assert.match(actions,/resolveOperatingSystemCommand\(prompt\)/);assert.match(actions,/searchParams\.set\(`\$\{kind\}Id`/);assert.match(actions,/recordLabel/)});
test("approval status memory and automation guidance are visible without duplicate chat",()=>{for(const value of ["approval governance preserved","Recent AI Activity","Approval Status","Suggested Automations","Prepared, never automatic"])assert.match(actions,new RegExp(value));assert.doesNotMatch(actions,/textarea|role="dialog"|position:fixed/)});
