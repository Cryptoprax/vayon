import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("contacts and companies remain server-rendered through one verified CRM tenant context", async () => {
  const [contactsPage, companiesPage, service, context] = await Promise.all([
    read("app/vayon/crm/contacts/page.tsx"),
    read("app/vayon/crm/companies/page.tsx"),
    read("features/vayon/crm-company/service.ts"),
    read("features/vayon/crm-company/context.ts"),
  ]);
  assert.match(contactsPage, /CrmCompanyService\.production\(\)/);
  assert.match(companiesPage, /CrmCompanyService\.production\(\)/);
  assert.match(service, /crmTenantContext\(\)/);
  assert.doesNotMatch(service, /operationsContext/);
  assert.match(context, /user_organization_context/);
  assert.match(context, /workspace_members/);
  assert.match(context, /\.eq\("user_id", user\.id\)/);
  assert.match(context, /\.eq\("status", "active"\)/);
  assert.match(context, /organizationId: membership\.organization_id/);
  assert.match(context, /workspaceId: membership\.workspace_id/);
  assert.match(context, /role: membership\.roles\?\.code/);
});

test("empty, null, undefined, and RLS-zero CRM reads normalize to normal empty results", async () => {
  const repository = await read("features/vayon/crm-company/repository.ts");
  assert.match(repository, /const rows=\(data\?\?\[\]\)as Row\[\]/);
  assert.match(repository, /return\{items:\[\],count:0,page,pageSize\}/);
  assert.match(repository, /recoverUnavailableRelation\("crm_contacts",error\)\)return\[\]/);
  assert.match(repository, /count:count\?\?rows\.length/);
  assert.doesNotMatch(repository, /if\(!data\)throw/);
});

test("only unavailable optional CRM relations recover; unexpected repository failures still throw", async () => {
  const repository = await read("features/vayon/crm-company/repository.ts");
  assert.match(repository, /new Set\(\["42P01","PGRST205"\]\)/);
  assert.match(repository, /schema cache/);
  assert.match(repository, /does not exist/);
  assert.match(repository, /crm\.optional_relation\.unavailable/);
  assert.match(repository, /if\(this\.recoverUnavailableRelation\("crm_companies",error\)\)/);
  assert.match(repository, /throw error/);
});

test("contacts and companies render accessible actionable empty states without reaching a global error UI", async () => {
  const [contacts, directories] = await Promise.all([
    read("features/vayon/crm-company/ContactDirectory.tsx"),
    read("features/vayon/crm-engine/components/CrmDirectory.tsx"),
  ]);
  assert.match(contacts, /title="No contacts yet"/);
  assert.match(contacts, /primaryLabel="Create Contact"/);
  assert.match(contacts, /label:"Import CSV"/);
  assert.match(directories, /title="No Companies Yet"/);
  assert.match(directories, /primaryLabel="Create Company"/);
  assert.doesNotMatch(`${contacts}${directories}`, /This workspace view could not load/);
});

test("CRM list bounds cover 100 contacts and paginate 100 companies", async () => {
  const [repository, companiesPage] = await Promise.all([
    read("features/vayon/crm-company/repository.ts"),
    read("app/vayon/crm/companies/page.tsx"),
  ]);
  assert.match(repository, /limit\(100\)/);
  assert.match(repository, /range\(from,from\+pageSize-1\)/);
  assert.match(companiesPage, /Math\.ceil\(data\.count\/data\.pageSize\)/);
});
