import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("amenities use grouped searchable keyboard-accessible structured selection", async () => {
  const [wizard, catalogs, action] = await Promise.all([
    read("features/vayon/property/components/PropertyWizard.tsx"),
    read("features/vayon/property/config/catalogs.ts"),
    read("features/vayon/property/actions/property.actions.ts"),
  ]);
  assert.match(wizard, /EnterpriseMultiSelect/);
  assert.match(wizard, /type="search"/);
  assert.match(wizard, /event\.key === "ArrowDown"/);
  assert.match(wizard, /name="customAmenity"/);
  assert.match(catalogs, /Residential|Commercial|Building & Security|Utilities/);
  assert.match(action, /getAll\("amenities"\)/);
  assert.match(action, /custom:/);
});

test("viewing instructions include every prescribed option and custom Other", async () => {
  const [wizard, catalogs] = await Promise.all([
    read("features/vayon/property/components/PropertyWizard.tsx"),
    read("features/vayon/property/config/catalogs.ts"),
  ]);
  for (const label of ["Appointment Required","Vacant","Occupied","Contact Agent","Contact Owner","24 Hours Notice","48 Hours Notice","Key at Office","Lockbox","Under Construction","Anytime","Other"]) assert.ok(catalogs.includes(label), label);
  assert.match(wizard, /name="viewingInstructions"/);
  assert.match(wizard, /Custom Viewing Instruction/);
});

test("documents have availability gating tri-state status and conditional permits", async () => {
  const [wizard, catalogs] = await Promise.all([
    read("features/vayon/property/components/PropertyWizard.tsx"),
    read("features/vayon/property/config/catalogs.ts"),
  ]);
  for (const label of ["Sale Deed","Occupancy Certificate","Completion Certificate","Khata","RERA","Tax Receipt","Encumbrance","Building Approval","NOC","Floor Plan","Identity","Utility Bills","Other"]) assert.ok(catalogs.includes(label), label);
  assert.match(wizard, /Documents Available\?/);
  assert.match(wizard, /Available/);
  assert.match(wizard, /Pending/);
  assert.match(wizard, /Not Applicable/);
  assert.match(wizard, /Permit Number/);
});

test("autosave preserves repeated structured values for mobile wizard drafts", async () => {
  const wizard = await read("features/vayon/property/components/PropertyWizard.tsx");
  assert.match(wizard, /string \| string\[\]/);
  assert.match(wizard, /localStorage\.setItem/);
  assert.match(wizard, /overflow-x-auto/);
  assert.match(wizard, /sm:grid-cols-2/);
});

test("successful create redirects outside try and NEXT_REDIRECT never reaches UI", async () => {
  const action = await read("features/vayon/property/actions/property.actions.ts");
  const create = action.slice(action.indexOf("export async function createPropertyAction"), action.indexOf("export async function updatePropertyAction"));
  assert.match(create, /let id:string;try\{/);
  assert.match(create, /catch\(e\).*redirect\(`\/vayon\/properties\/\$\{id\}/);
  assert.doesNotMatch(create, /try\{[^}]*redirect\(/);
  assert.doesNotMatch(action, /NEXT_REDIRECT/);
});

test("create edit duplicate draft and publish routes retain governed property contracts", async () => {
  const [wizard, repository, service] = await Promise.all([
    read("features/vayon/property/components/PropertyWizard.tsx"),
    read("features/vayon/property/repositories/property.repository.ts"),
    read("features/vayon/property/services/property.service.ts"),
  ]);
  assert.match(wizard, /editing \? "Save changes" : "Create property"/);
  assert.match(wizard, /Draft saved locally/);
  assert.match(repository, /create_property/);
  assert.match(repository, /update_property/);
  assert.match(service, /create/);
  assert.match(service, /update/);
});
