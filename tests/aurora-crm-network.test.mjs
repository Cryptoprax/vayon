import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(path, "utf8");
const companies = read("features/vayon/demo-workspace/crm-network/companies.ts");
const contacts = read("features/vayon/demo-workspace/crm-network/contacts.ts");
const service = read("features/vayon/demo-workspace/crm-network/network.service.ts");
const provider = read("features/vayon/demo-workspace/crm-network/search.provider.ts");
const shell = read("features/vayon/product-shell/ShellHeader.tsx");
const home = read("app/vayon/home/page.tsx");
const contract = read("features/vayon/demo-workspace/crm-network/contracts.ts");

test("Aurora defines 36 unique fictional companies and four contacts per company", () => {
  const records = [...companies.matchAll(/\["([^"]+)","(developer|builder|investor|bank|law-firm|interior-designer|architect|construction-company|corporate-client|channel-partner|property-management)"/g)];
  assert.equal(records.length, 36);
  assert.equal(new Set(records.map(record => record[1])).size, 36);
  assert.match(contacts, /\[0,1,2,3\]\.map/);
  assert.equal(records.length * 4, 144);
});

test("company categories and contact relationship roles cover the requested network", () => {
  for (const category of ["developer","builder","investor","bank","law-firm","interior-designer","architect","construction-company","corporate-client","channel-partner","property-management"]) assert.match(companies, new RegExp(`\\"${category}\\"`));
  for (const role of ["decision-maker","influencer","legal-contact","finance-contact","technical-contact"]) assert.match(contract, new RegExp(`\\"${role}\\"`));
});

test("network validates relationship integrity and exposes every required filter", () => {
  for (const evidence of ["Duplicate Aurora company identity","Duplicate Aurora contact identity","Orphan Aurora contact","Invalid primary contact","industry","city","relationshipStatus","businessUnit","companyType","contactRole","tags"]) assert.match(service, new RegExp(evidence));
  assert.match(companies, /primaryContactId:`aurora-contact-\$\{companySlug\}-1`/);
});

test("identities are stable and timeline-ready without generating events", () => {
  assert.match(contract, /namespace:"aurora-demo-crm"/);
  assert.match(contract, /timelineEligible:true/);
  assert.match(contract, /events:readonly never\[\]/);
  assert.match(companies, /events:Object\.freeze\(\[\]\)/);
  assert.match(contacts, /events:Object\.freeze\(\[\]\)/);
});

test("local Universal Bar discovery is limited to the Aurora demo identity", () => {
  assert.match(provider, /implements UniversalSearchProvider/);
  assert.match(provider, /readonly scopes=\["companies","contacts"\]/);
  assert.match(shell, /includeAuroraCrm=\{identity\.demoWorkspace==="aurora"\}/);
});

test("legacy home redirects while CRM avoids fabricated ranking and recency", () => {
  assert.match(home, /redirect\(destination\)/);
  assert.match(service, /topCompanies:Object\.freeze\(\[\]\)/);
  assert.match(service, /newestContacts:Object\.freeze\(\[\]\)/);
  assert.match(service, /analytics:"none"/);
});

test("CRM network has no persistence, external calls, or production event generation", () => {
  const source = [companies, contacts, service, provider, contract].join("\n");
  for (const forbidden of ["createClient(", ".from(", ".insert(", ".update(", "fetch(", "EventFactory", "publish(", "openai", "anthropic"]) assert.equal(source.includes(forbidden), false, forbidden);
  assert.equal(source.includes("leadId"), false);
  assert.equal(source.includes("dealId"), false);
  assert.equal(source.includes("propertyId"), false);
});

test("release documentation, ADR, and local visual asset exist", () => {
  assert.equal(existsSync("docs/RELEASE_1_8_2_CRM_NETWORK.md"), true);
  assert.equal(existsSync("docs/ADR-0020-crm-network-model.md"), true);
  assert.equal(existsSync("public/vayon/demo/crm/company-placeholder.svg"), true);
});
