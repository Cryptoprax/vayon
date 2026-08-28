import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
test("operational workforce defines all eight first-class employees", () => {
  const source = read(
    "features/vayon/operational-workforce/repositories/workforce-data.ts",
  );
  for (const name of [
    "Sarah",
    "Emma",
    "Olivia",
    "Voice AI",
    "Alex",
    "David",
    "Finance AI",
    "Executive AI",
  ])
    assert.match(source, new RegExp(name));
});
test("employee and task contracts expose required lifecycle fields", () => {
  const source = read("features/vayon/operational-workforce/domain/models.ts");
  for (const value of [
    "online",
    "processing",
    "idle",
    "error",
    "offline",
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
    "memory",
    "permissions",
    "health",
    "version",
  ])
    assert.match(source, new RegExp(value));
});
test("production repository is tenant scoped and read only", () => {
  const source = read(
    "features/vayon/operational-workforce/repositories/supabase.repository.ts",
  );
  assert.match(source, /organization_id/);
  assert.match(source, /workspace_id/);
  assert.doesNotMatch(source, /insert\(|update\(|delete\(|upsert\(|rpc\(/);
});
test("provider execution is deterministic and external providers are contracts only", () => {
  const source = read(
    "features/vayon/operational-workforce/providers/provider.ts",
  );
  assert.match(source, /DeterministicProvider/);
  for (const method of ["execute", "summarize", "recommend", "health"])
    assert.match(source, new RegExp(`${method}\\(`));
  assert.doesNotMatch(source, /fetch\(|openai\.|anthropic\.|gemini\./i);
});
test("all requested workforce routes exist", () => {
  for (const path of [
    "app/vayon/ai/page.tsx",
    "app/vayon/ai/workforce/page.tsx",
    "app/vayon/ai/workforce/[employeeId]/page.tsx",
    "app/vayon/ai/tasks/page.tsx",
    "app/vayon/ai/history/page.tsx",
  ])
    assert.doesNotThrow(() => read(path));
});
test("profiles dashboards tasks and activity use reusable views", () => {
  const source = read(
    "features/vayon/operational-workforce/components/WorkforceViews.tsx",
  );
  for (const name of [
    "CommandCenter",
    "EmployeeGrid",
    "EmployeeProfile",
    "TaskList",
    "ActivityList",
  ])
    assert.match(source, new RegExp(name));
});
test("workforce documentation records lifecycle provider and safety boundaries", () => {
  const source = read("docs/AI_WORKFORCE.md");
  for (const term of [
    "Employee lifecycle",
    "Task model",
    "Provider interfaces",
    "Future AI integration strategy",
    "Safety boundaries",
  ])
    assert.match(source, new RegExp(term));
});
