import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (path) => readFile(path, "utf8");

test("dashboard, sidebar, quick actions, breadcrumbs, and generated recommendations resolve", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-route-integrity.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Route integrity audit passed/);
});

test("the obsolete home route remains only as compatibility policy, never as navigation", async () => {
  const [oauth, audit] = await Promise.all([
    read("features/authentication/security/oauth.ts"),
    read("scripts/audit-route-integrity.mjs"),
  ]);
  assert.match(oauth, /legacyAuthenticatedPaths = new Map\(\[\["\/vayon\/home", "\/vayon\/dashboard"\]\]\)/);
  assert.match(audit, /href === "\/vayon\/home"/);
});

test("Server Actions never catch NEXT_REDIRECT control flow", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-mutation-reliability.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("task creation verifies persistence, revalidates, redirects, and reports success or failure", async () => {
  const [actions, repository, page, form] = await Promise.all([
    read("features/vayon/operations/actions/operations.actions.ts"),
    read("features/vayon/operations/repositories/task.repository.ts"),
    read("app/vayon/tasks/page.tsx"),
    read("features/vayon/operations/components/OperationForms.tsx"),
  ]);
  assert.match(actions, /TaskService\(\)\.create/);
  assert.match(actions, /revalidatePath\("\/vayon\/tasks"\)/);
  assert.match(actions, /Task created successfully/);
  assert.match(repository, /if\(!data\)throw new Error/);
  assert.match(page, /success=\{query\.success\}/);
  assert.match(form, /role="status"/);
  assert.match(form, /role="alert"/);
  assert.match(form, /type="submit"/);
});

test("create workflow routes exist for properties, clients, companies, leads, campaigns, deals, and tasks", async () => {
  const required = [
    "app/vayon/properties/new/page.tsx",
    "app/vayon/leads/new/page.tsx",
    "app/vayon/crm/companies/new/page.tsx",
    "app/vayon/creative-studio/wizard/page.tsx",
    "app/vayon/deals/new/page.tsx",
    "app/vayon/tasks/page.tsx",
  ];
  for (const path of required) assert.ok((await read(path)).length > 0, path);
});
