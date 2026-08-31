import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("all static internal navigation destinations resolve to application routes", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-route-integrity.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Route integrity audit passed/);
});

test("creative navigation resolves or renders a branded availability state", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  const routes = [
    ["Creative operating system", "app/vayon/creative/page.tsx"],
    ["Creative operating model", "app/vayon/creative/cloud/page.tsx"],
    ["Production orchestration", "app/vayon/creative/pipelines/page.tsx"],
  ];
  for (const [label, path] of routes) {
    assert.match(navigation, new RegExp(label, "i"));
    const source = read(path);
    assert.match(source, /FeatureAvailabilityState/);
    assert.doesNotMatch(source, /notFound\(\)/);
  }
  const state = read("features/vayon/empty-states/FeatureAvailabilityState.tsx");
  assert.match(state, /Coming Soon/);
  assert.match(state, /Join Early Access/);
});

test("first workspace keeps atomic defaults and exposes guided progress", () => {
  const bootstrap = read("features/onboarding/services/workspace-bootstrap.service.ts");
  const home = read("app/vayon/home/page.tsx");
  const migration = read("supabase/migrations/20260813000000_sprint22_production_baseline.sql");
  assert.match(bootstrap, /OnboardingService\(\)\.provision/);
  assert.match(bootstrap, /EnterpriseOnboardingService\(\)\.save/);
  assert.match(bootstrap, /businessType: "Real Estate"/);
  assert.match(home, /redirect\(destination\)/);
  assert.match(home, /\/vayon\/dashboard/);
  for (const provisioner of ["provision_ai_workforce_after_workspace", "provision_billing_after_workspace", "provision_integrations_after_workspace"])
    assert.match(migration, new RegExp(provisioner));
});

test("onboarding progress links remain route-safe and action oriented", () => {
  const setup = read("features/onboarding/components/WorkspaceSetupCenter.tsx");
  for (const label of ["Workspace Setup", "Recommended next action", "Estimated time", "Configure", "Later"])
    assert.match(setup, new RegExp(label));
  assert.match(setup, /completed_steps/);
  assert.match(setup, /Workspace health/);
});
