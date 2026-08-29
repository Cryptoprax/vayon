import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("onboarding route prepares the tenant before rendering", async () => {
  const source = await read("app/onboarding/page.tsx");
  assert.match(source, /OnboardingRecoveryService/);
  assert.match(source, /\.prepare\(user\)/);
  assert.doesNotMatch(source, /Promise\.all/);
});

test("missing workspace uses the existing atomic bootstrap", async () => {
  const source = await read("features/onboarding/services/onboarding-recovery.service.ts");
  assert.match(source, /WorkspaceBootstrapService/);
  assert.match(source, /await this\.bootstrap\.ensure\(user\)/);
  assert.match(source, /WORKSPACE_NOT_FOUND/);
});

test("missing onboarding progress is initialized through the existing service", async () => {
  const source = await read("features/onboarding/services/onboarding-recovery.service.ts");
  assert.match(source, /await this\.onboarding\.save\(1, \{\}, \[\], false\)/);
  assert.match(source, /ONBOARDING_NOT_FOUND/);
});

test("missing membership and RLS denial remain deterministic", async () => {
  const source = await read("features/onboarding/services/onboarding-recovery.service.ts");
  assert.match(source, /MEMBERSHIP_NOT_FOUND/);
  assert.match(source, /value\?\.code === "42501"/);
  assert.match(source, /RLS_DENIED/);
});

test("structured diagnostics contain required operational context without secrets", async () => {
  const source = await read("features/onboarding/services/onboarding-recovery.service.ts");
  for (const field of ["route", "organizationId", "workspaceId", "userId", "step", "repository", "service", "errorCode", "stack"])
    assert.match(source, new RegExp(field));
  assert.doesNotMatch(source, /accessToken|refreshToken|serviceRoleKey/);
});

test("client automatically retries once and protects production diagnostics", async () => {
  const source = await read("app/onboarding/error.tsx");
  assert.match(source, /We’re preparing your workspace/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /window\.setTimeout\(reset/);
  assert.match(source, /NODE_ENV === "development"/);
  assert.match(source, /Retry recovery/);
  assert.doesNotMatch(source, /Workspace setup could not load/);
});
