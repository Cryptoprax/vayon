import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AI Command Center is Founder-only", async () => {
  const route = await read("app/platform/founder/command-center/page.tsx"),
    service = await read(
      "features/platform/ai-command-center/services/ai-command-center.service.ts",
    );
  assert.match(route, /FounderAccessError/);
  assert.match(route, /notFound\(\)/);
  assert.match(service, /founderContext\(\)/);
});
test("command center reuses operations and collaboration services", async () => {
  const source = await read(
    "features/platform/ai-command-center/services/ai-command-center.service.ts",
  );
  assert.match(source, /AutonomousOperationsService/);
  assert.match(source, /AICollaborationService/);
  assert.doesNotMatch(source, /new OpenAIProvider/);
});
test("directory contains every requested AI capability", async () => {
  const source = await read(
    "features/platform/ai-command-center/services/ai-command-center.service.ts",
  );
  for (const value of [
    "Founder AI",
    "Marketing AI",
    "Sales AI",
    "Customer Success AI",
    "Creative AI",
    "Knowledge AI",
    "Integration AI",
    "Workflow AI",
  ])
    assert.ok(source.includes(value), value);
});
test("agent directory exposes operating and governance metadata", async () => {
  const source = await read(
    "features/platform/ai-command-center/services/ai-command-center.service.ts",
  );
  for (const value of [
    "purpose",
    "owner",
    "permissions",
    "capabilities",
    "integrations",
    "status",
    "workload",
    "lastExecution",
    "confidence",
    "evidence",
  ])
    assert.ok(source.includes(value), value);
});
test("multi-AI objective uses existing collaboration endpoint", async () => {
  const source = await read(
    "features/platform/ai-command-center/components/ObjectiveCoordinator.tsx",
  );
  assert.match(source, /\/api\/ai\/workforce\/collaborate/);
  assert.match(source, /Increase subscriptions by 20%/);
  for (const value of [
    "Depends on task",
    "Progress",
    "blocked items",
    "completed work",
    "approvals",
  ])
    assert.match(source, new RegExp(value, "i"));
});
test("decision board ranks impact confidence urgency ROI and evidence", async () => {
  const service = await read(
      "features/platform/ai-command-center/services/ai-command-center.service.ts",
    ),
    ui = await read(
      "features/platform/ai-command-center/components/AICommandCenter.tsx",
    );
  assert.match(service, /urgency/);
  assert.match(service, /expectedRoi/);
  for (const value of [
    "Impact",
    "Confidence",
    "Expected ROI",
    "Supporting evidence",
  ])
    assert.ok(ui.includes(value), value);
});
test("activity mission control and performance are unified", async () => {
  const ui = await read(
    "features/platform/ai-command-center/components/AICommandCenter.tsx",
  );
  for (const value of [
    "Global AI activity",
    "Mission control",
    "Today's priorities",
    "Pending approvals",
    "Critical risks",
    "AI performance",
    "Tasks completed",
    "Workflow success",
    "Provider availability",
    "Execution failures",
  ])
    assert.ok(ui.includes(value), value);
});
test("Founder actions preserve existing audited services", async () => {
  const ui = await read(
    "features/platform/ai-command-center/components/AICommandCenter.tsx",
  );
  for (const value of [
    "Approve",
    "Reject",
    "Reschedule",
    "Delegate",
    "Archive",
    "/vayon/ai/tasks",
    "/vayon/workflows",
  ])
    assert.ok(ui.includes(value), value);
  assert.match(ui, /existing RBAC,\s+version checks, and audit history/);
});
test("streaming Founder AI navigation and documentation are complete", async () => {
  const ui = await read(
      "features/platform/ai-command-center/components/AICommandCenter.tsx",
    ),
    nav = await read(
      "features/platform/founder/components/FounderDashboard.tsx",
    ),
    docs = await read("docs/VAYON_AI_COMMAND_CENTER.md");
  assert.match(ui, /WorkforceChatPanel/);
  assert.match(nav, /VAYON AI Command Center/);
  assert.match(docs, /No live provider/);
  assert.match(docs, /Tenant isolation/);
});
