import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("demo remains isolated read-only seeded fixture architecture", async () => {
  const [contracts, component, route] = await Promise.all([read("features/vayon/demo-experience/domain/contracts.ts"),read("features/vayon/demo-experience/components/DemoExperience.tsx"),read("app/demo/page.tsx")]);
  assert.match(contracts, /persistence: "seeded-json-fixtures"/);
  assert.match(contracts, /readOnly: true/);
  assert.match(component, /data-demo-tenant="aurora-demo-workspace"/);
  assert.match(component, /Changes are not persisted/);
  assert.doesNotMatch(route, /createSupabase|FounderService|OpenAI/);
});

test("all five audience modes are explicit and selectable", async () => {
  const [route, repository] = await Promise.all([read("app/demo/page.tsx"),read("features/vayon/demo-experience/repository/aurora-enterprise.repository.ts")]);
  for (const mode of ["visitor","sales","investor","founder","enterprise"]) assert.match(`${route}\n${repository}`,new RegExp(`"${mode}"`));
  assert.match(repository,/openingTab/);
  assert.match(repository,/highlights/);
});

test("enterprise demo projection covers complete requested sample surfaces", async () => {
  const source = await read("features/vayon/demo-experience/repository/aurora-enterprise.repository.ts");
  for (const surface of ["team","workflows","aiRecommendations","notifications","billing","analytics","campaigns","subscriptions","knowledge","creative","customerSuccess","reports","aiDemonstrations"]) assert.match(source,new RegExp(surface));
  for (const entity of ["auroraCompanies","auroraContacts","auroraDeals","auroraEmployees","auroraLeads","auroraProperties"]) assert.match(source,new RegExp(entity));
});

test("guided tours explain business value across required modules", async () => {
  const source = `${await read("features/vayon/demo-experience/components/DemoExperience.tsx")}\n${await read("features/vayon/demo-experience/repository/aurora-enterprise.repository.ts")}`;
  for (const moduleName of ["CRM","Marketing AI","Sales AI","Customer Success","Founder AI","Workflow Automation","AI Command Center","Knowledge Platform","Creative Studio","Integration Hub"]) assert.match(source,new RegExp(moduleName));
  assert.match(source,/business goal/);
  assert.match(source,/qualified demand/);
});

test("live AI demonstrations are deterministic labeled and recommendation only", async () => {
  const source = await read("features/vayon/demo-experience/repository/aurora-enterprise.repository.ts");
  for (const agent of ["Founder AI","Marketing AI","Sales AI","Customer Success AI","Knowledge AI","Creative AI","Workflow AI"]) assert.match(source,new RegExp(agent));
  assert.match(source,/Deterministic demonstration insight/);
  assert.match(source,/recommendation only/);
});

test("investor experience separates released evidence demo content and roadmap", async () => {
  const source = await read("features/vayon/demo-experience/repository/aurora-enterprise.repository.ts");
  for (const section of ["Platform overview","Architecture","Business and growth metrics","AI capabilities","Enterprise scalability","Security","Roadmap"]) assert.match(source,new RegExp(section));
  assert.match(source,/demo_content/);
  assert.match(source,/forward_looking/);
});

test("executive story and presentation mode support keyboard navigation", async () => {
  const source = await read("features/vayon/demo-experience/components/DemoExperience.tsx");
  for (const key of ["ArrowRight","ArrowLeft","Escape"]) assert.match(source,new RegExp(key));
  assert.match(source,/Start fullscreen-friendly presentation mode/);
  assert.match(source,/Executive story/);
  assert.match(source,/Screenshot/);
});

test("Sprint 114 documentation records release and provider boundaries", async () => {
  const source = await read("docs/INTERACTIVE_DEMO_INVESTOR_EXPERIENCE.md");
  assert.match(source,/No live provider was connected/);
  assert.match(source,/No deployment or commit/);
  assert.match(source,/production data/i);
});
