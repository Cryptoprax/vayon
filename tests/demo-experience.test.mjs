import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("demo remains an additive public route", () => {
  const source = read("lib/supabase/proxy.ts");
  assert.match(source, /"\/demo"/);
  assert.match(source, /PUBLIC_ROUTES/);
  assert.match(source, /if\s*\(!user\s*&&\s*!isPublic\)/);
});
test("demo route uses the service and shared dashboard", () => {
  assert.match(read("app/demo/page.tsx"), /DemoExperienceService/);
  assert.match(
    read("features/vayon/demo-experience/components/DemoExperience.tsx"),
    /DashboardShell/,
  );
});
test("demo repository is isolated read only and fixture backed", () => {
  const source = read(
    "features/vayon/demo-experience/repository/aurora-demo.repository.ts",
  );
  assert.match(source, /AuroraDemoRepository/);
  assert.match(source, /readOnly:\s*true/);
  assert.match(source, /seeded-json-fixtures/);
  assert.doesNotMatch(
    source,
    /supabase|client\.from\(|insert\(|update\(|delete\(/,
  );
});
test("demo inventory exceeds required experience volumes", () => {
  const source = read(
    "features/vayon/demo-experience/repository/aurora-demo.repository.ts",
  );
  assert.match(source, /length:\s*1000/);
  assert.match(source, /length:\s*500/);
  assert.match(source, /length:\s*240/);
  assert.match(source, /slice\(-720\)/);
  assert.match(source, /auroraProperties/);
  assert.match(source, /auroraDeals/);
});
test("demo interactions enforce read only behavior", () => {
  const source = read(
    "features/vayon/demo-experience/components/DemoExperience.tsx",
  );
  assert.match(source, /Changes are not saved/);
  assert.match(source, /event.preventDefault/);
  assert.match(source, /startsWith\("\/vayon"\)/);
  assert.match(source, /pageSize\s*=\s*24/);
});
