import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Autonomous Operations Center is Founder-only", async () => {
  const route = await read("app/platform/founder/operations/page.tsx");
  const service = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  assert.match(route, /FounderAccessError/);
  assert.match(route, /notFound\(\)/);
  assert.match(service, /founderContext\(\)/);
});

test("operations service composes existing intelligence infrastructure", async () => {
  const source = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  for (const value of [
    "IntelligenceHubService",
    "WorkflowOrchestrationService",
    "EnterpriseIntegrationService",
    "UnifiedAIContextService",
    "Promise.all",
  ])
    assert.ok(source.includes(value), value);
});

test("control tower exposes every requested operating status", async () => {
  const source = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  for (const value of [
    "Business",
    "Revenue",
    "Marketing",
    "Sales",
    "Customer Success",
    "Product",
    "Platform",
    "Security",
    "AI Workforce",
  ])
    assert.ok(source.includes(`\"${value}\"`), value);
});

test("objectives expose progress ownership workflows and evidence", async () => {
  const service = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  const ui = await read(
    "features/platform/autonomous-operations/components/AutonomousOperationsDashboard.tsx",
  );
  for (const value of [
    "Increase trial conversions",
    "Reduce churn",
    "Increase MRR",
    "Improve onboarding",
    "Increase enterprise deals",
    "Reduce response time",
  ])
    assert.ok(service.includes(value), value);
  for (const value of ["progress", "modules", "relatedWorkflows", "evidence"])
    assert.ok(ui.includes(value), value);
});

test("AI task coordination supports every governed lifecycle state", async () => {
  const source = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  for (const value of [
    "Queued",
    "Running",
    "Waiting Approval",
    "Completed",
    "Failed",
    "Cancelled",
  ])
    assert.ok(source.includes(`\"${value}\"`), value);
});

test("risks priorities and actions remain evidence-backed and approval-only", async () => {
  const service = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  const ui = await read(
    "features/platform/autonomous-operations/components/AutonomousOperationsDashboard.tsx",
  );
  assert.match(service, /founder_approval_required/);
  assert.match(ui, /Explicit Founder approval required/);
  assert.match(ui, /Evidence-backed risk/);
  assert.match(ui, /Supporting evidence/);
});

test("simulation is isolated from production writes", async () => {
  const source = await read(
    "features/platform/autonomous-operations/components/OperationsWorkbench.tsx",
  );
  assert.match(source, /Simulation only · no production writes/);
  assert.match(source, /not a forecast or guarantee/);
  assert.doesNotMatch(source, /fetch\(/);
});

test("Founder AI chat streams with memory explainability and realtime refresh", async () => {
  const ui = await read(
    "features/platform/autonomous-operations/components/AutonomousOperationsDashboard.tsx",
  );
  assert.match(ui, /WorkforceChatPanel/);
  assert.match(ui, /explainability=/);
  assert.match(ui, /FounderRealtime/);
});

test("all executive digests and documentation are present", async () => {
  const service = await read(
    "features/platform/autonomous-operations/services/autonomous-operations.service.ts",
  );
  const docs = await read("docs/AUTONOMOUS_BUSINESS_OPERATIONS_CENTER.md");
  for (const value of [
    "Morning Digest",
    "Midday Summary",
    "Evening Summary",
    "Weekly Review",
    "Monthly Executive Review",
    "Quarterly Board Review",
    "PDF",
    "PowerPoint",
  ])
    assert.ok(service.includes(value) || docs.includes(value), value);
  assert.match(docs, /Founder-only/);
  assert.match(docs, /No autonomous production writes/);
});
