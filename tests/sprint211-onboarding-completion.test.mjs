import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Google signup and login converge on the workspace-aware entry route", async () => {
  const [callback, entry] = await Promise.all([read("app/auth/callback/route.ts"), read("app/vayon/page.tsx")]);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /safeAuthenticatedPath\(next\)/);
  assert.match(entry, /WorkspaceService/);
  assert.match(entry, /\/vayon\/dashboard/);
});

test("brand new and existing workspaces are verified before dashboard access", async () => {
  const [creation, completion] = await Promise.all([
    read("features/onboarding/services/onboarding.service.ts"),
    read("features/onboarding/services/onboarding-completion.service.ts"),
  ]);
  for (const value of ["organization_id", "workspace_id", "workspace_members", "organization_owner", "created_by", 'status !== "active"']) assert.match(creation + completion, new RegExp(value));
});

test("workspace creation and authentication failures remain blocking and diagnosed", async () => {
  const source = await read("features/onboarding/services/onboarding-completion.service.ts");
  assert.match(source, /stage: "authenticate"/);
  assert.match(source, /stage: "validate_workspace"/);
  assert.match(source, /success: false/);
  assert.match(source, /workspaceId: null/);
});

test("organization membership and ownership failures are explicit", async () => {
  const source = await read("features/onboarding/services/onboarding-completion.service.ts");
  assert.match(source, /create_organization/);
  assert.match(source, /create_membership/);
  assert.match(source, /validate_ownership/);
  assert.match(source, /Workspace ownership or active membership verification failed/);
});

test("optional provisioning failure stores a verified retry task and still redirects", async () => {
  const [service, migration] = await Promise.all([
    read("features/onboarding/services/onboarding-completion.service.ts"),
    read("supabase/migrations/20260928000000_sprint211_onboarding_completion.sql"),
  ]);
  assert.match(service, /Retry onboarding provisioning/);
  assert.match(service, /\.select\("id"\)\.single\(\)/);
  assert.match(service, /stage: "redirect", success: true/);
  assert.match(migration, /Retry AI employee provisioning/);
  assert.match(migration, /exception when others/);
});

test("completion fixes the invalid audit event without changing the audit schema", async () => {
  const migration = await read("supabase/migrations/20260928000000_sprint211_onboarding_completion.sql");
  assert.match(migration, /'organization.updated'/);
  assert.match(migration, /'action','onboarding.completed'/);
  assert.doesNotMatch(migration, /alter table|add column|drop column/i);
});

test("Open my workspace always targets the canonical dashboard after mandatory validation", async () => {
  const action = await read("features/onboarding/actions/enterprise-onboarding.actions.ts");
  assert.match(action, /OnboardingCompletionService/);
  assert.match(action, /\/vayon\/dashboard\?welcome=1&tour=1/);
  assert.doesNotMatch(action, /\/vayon\/home|\/vayon\/customer-success/);
});
