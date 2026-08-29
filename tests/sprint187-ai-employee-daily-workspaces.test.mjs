import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("daily workspace presents a complete evidence-backed working day", async () => {
  const source = await read("features/vayon/operational-workforce/components/EmployeeDailyWorkspace.tsx");
  for (const value of ["Good morning", "Current Focus", "Today(?:&apos;|')s Goals", "Daily Score", "Today(?:&apos;|')s Work", "Workload", "Business Health", "Upcoming Schedule", "Recent Achievements", "Recent Activity", "Team Collaboration", "Knowledge Panel", "Employee Commands"]) assert.match(source, new RegExp(value));
  for (const employee of ["sales-ai", "crm-ai", "marketing-ai", "operations-ai", "whatsapp-ai"]) assert.match(source, new RegExp(employee));
});

test("recommendations preserve approval controls and evidence language", async () => {
  const source = await read("features/vayon/operational-workforce/components/EmployeeDailyWorkspace.tsx");
  for (const value of ["Approve", "Modify", "Reject", "View Related Record", "Explain", "Approval", "Evidence", "Nothing executes automatically", "no autonomous"]) assert.match(source, new RegExp(value, "i"));
  assert.doesNotMatch(source, /Math\.random|fetch\(|createSupabaseServerClient|\.from\(/);
});

test("employee route reuses workforce and collaboration projections with lazy secondary UI", async () => {
  const route = await read("app/vayon/ai/workforce/[employeeId]/page.tsx");
  assert.match(route, /WorkforceService\.production/);
  assert.match(route, /AICollaborationService\.production/);
  assert.match(route, /dynamic\(\(\) => import\("@\/features\/vayon\/operational-workforce\/components\/EmployeeDailyWorkspace"\)\)/);
  assert.doesNotMatch(route, /insert\(|update\(|delete\(|execute\(/);
});

test("empty state guides users without inventing business evidence", async () => {
  const source = await read("features/vayon/operational-workforce/components/EmployeeDailyWorkspace.tsx");
  assert.match(source, /I&apos;m ready to begin working/);
  assert.match(source, /Import Data/);
  assert.match(source, /Explore Demo Workspace/);
  assert.match(source, /Not available|Awaiting supporting workspace evidence/);
});
