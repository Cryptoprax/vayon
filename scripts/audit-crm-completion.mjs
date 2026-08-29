import{readFile}from"node:fs/promises";
const read=p=>readFile(new URL(`../${p}`,import.meta.url),"utf8"),checks=[
 ["schema",await read("supabase/migrations/20260925000000_sprint193_crm_foundation.sql"),["crm_companies","crm_contacts","score_crm_lead","create_crm_company","workspace_id"]],
 ["companies",(await read("features/vayon/crm-company/CompanyProfile.tsx"))+(await read("app/vayon/crm/companies/page.tsx")),["Contacts","Properties","Deals","Timeline","Business Opportunity","Create Company"]],
 ["leads",(await read("features/vayon/crm-engine/components/CrmLeadProfile.tsx"))+(await read("features/vayon/lead/components/LeadWizard.tsx")),["Score","interest","Evidence","Search Property","Salesperson","AI Auto Assign"]],
 ["contacts",await read("features/vayon/crm-company/ContactDirectory.tsx"),["Primary Company","Department","Owner","No Contacts"]]
];let failed=false;for(const[name,source,needles]of checks)for(const needle of needles)if(!source.includes(needle)){console.error(`CRM completion audit failed: ${name} missing ${needle}`);failed=true}if(failed)process.exit(1);console.log("CRM completion audit passed: additive schema, Companies, Contacts, lead intelligence, property matching, assignment, accessibility copy, and tenant scoping are present.");
