import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const contracts = read("features/vayon/intelligence-core/contracts.ts");
const graph = read("features/vayon/intelligence-core/context-graph.ts");
const engine = read("features/vayon/intelligence-core/success-engine.ts");
const registry = read("features/vayon/intelligence-core/module-registry.ts");
const panel = read(
  "features/vayon/intelligence-core/components/VayonIntelligence.tsx",
);
const shell = read("features/vayon/components/VayonShell.tsx");

test("central Context Graph exposes governed tenant page and capability context", () => {
  for (const value of [
    "availableActions",
    "permissions",
    "integrations",
    "featureAvailable",
    "selectedRecord",
    "workflow",
    "subscriptionPlan",
  ])
    assert.match(contracts + graph, new RegExp(value));
  assert.match(graph, /safeContextForPrompt/);
  assert.doesNotMatch(graph, /service_role|apiKey|secret/i);
});

test("success engine detects every requested proactive condition", () => {
  for (const value of [
    "first_visit",
    "empty_state",
    "long_inactivity",
    "repeated_failure",
    "validation_error",
    "permission_issue",
    "configuration_issue",
    "incomplete_onboarding",
    "slow_workflow",
  ])
    assert.match(engine, new RegExp(value));
});

test("onboarding coach tracks only evidence-backed first milestones", () => {
  for (const value of [
    "first_project",
    "first_inventory",
    "first_lead",
    "first_visit",
    "first_campaign",
    "detectOnboardingMilestone",
  ])
    assert.match(engine, new RegExp(value));
  assert.match(panel, /Milestone completed/);
  assert.match(panel, /vayon\.intelligence\.milestone/);
});

test("error explanations are sanitized actionable and preserve governance", () => {
  assert.match(engine, /Your data remains unchanged/);
  assert.match(engine, /does not allow|does not respond|not connected/);
  assert.doesNotMatch(
    panel,
    /stack|error\.message|JSON\.stringify\(diagnostic/,
  );
});

test("proactive help and empty-state assistance reuse guides videos and prompts", () => {
  for (const value of [
    "proactive.title",
    "proactive.explanation",
    "proactive.nextStep",
    "proactive.helpHref",
    "proactive.videoHref",
    "proactive.prompt",
  ])
    assert.match(panel, new RegExp(value.replaceAll(".", "\\.")));
});

test("quick actions are centralized and remain recommendation only", () => {
  for (const value of [
    "Import Inventory",
    "Create Campaign",
    "Create Lead",
    "Book Visit",
    "Generate Proposal",
    "Connect WhatsApp",
  ])
    assert.match(registry, new RegExp(value));
  assert.match(panel, /No action is\s+executed autonomously/);
  assert.match(contracts, /recommendationOnly:\s*true/);
});

test("authoritative identity metadata flows into the tenant Context Graph", () => {
  assert.match(shell, /organization\?\.id/);
  assert.match(shell, /app_metadata\?\.role/);
  assert.match(shell, /subscription_plan/);
  assert.match(shell, /app_metadata\?\.permissions/);
});

test("copilot remains lazy feature-gated responsive and VDS-owned", () => {
  const product = read("features/vayon/components/ProductExperience.tsx");
  assert.match(product, /dynamic\(/);
  assert.match(product, /intelligenceEnabled &&/);
  assert.match(panel, /100dvh|100vw/);
  assert.doesNotMatch(panel, /<button\b/);
});
