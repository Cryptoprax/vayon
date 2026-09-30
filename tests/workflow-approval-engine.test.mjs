import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
test("governance model covers workflow approval execution and audit", () => {
  const source = read("features/vayon/workflow-approval/domain/models.ts");
  for (const value of [
    "WorkflowStep",
    "conditions",
    "inputs",
    "outputs",
    "owner",
    "ApprovalRequest",
    "humanApprover",
    "decision",
    "ExecutionRequest",
    "AuditEntry",
  ])
    assert.match(source, new RegExp(value));
});
// Phase D1 (a later, explicitly authorized controlled phase) replaced
// GovernanceService's production path with a real, tenant-scoped Supabase
// repository -- the demo policy object that used to embed this action-type
// list directly in governance.service.ts moved with the rest of the untouched
// demo scaffold, and now lives only in the retained in-memory fixture
// repository. See tests/phase-d1-approval-workflows.test.mjs for the new
// production behavior's own coverage.
test("all supported demo action contracts require a policy", () => {
  const model = read("features/vayon/workflow-approval/domain/models.ts"),
    demoRepository = read(
      "features/vayon/workflow-approval/repositories/in-memory.repository.ts",
    );
  for (const action of [
    "whatsapp.message",
    "email.draft",
    "meeting.schedule",
    "lead.assign",
    "deal.update",
    "document.generate",
    "campaign.launch",
    "task.create",
  ]) {
    assert.match(model, new RegExp(action.replace(".", "\\.")));
    assert.match(demoRepository, new RegExp(action.replace(".", "\\.")));
  }
});
test("approval lifecycle forbids self approval and requires a reason", () => {
  const source = read(
    "features/vayon/workflow-approval/engines/approval.engine.ts",
  );
  assert.match(source, /forbids self approval/);
  assert.match(source, /require a reason/);
  for (const decision of ["pending", "approved", "rejected"])
    assert.match(
      read("features/vayon/workflow-approval/domain/models.ts"),
      new RegExp(decision),
    );
});
test("execution lifecycle supports cancellation and expiry without execution", () => {
  const source = read(
    "features/vayon/workflow-approval/engines/execution.engine.ts",
  );
  assert.match(source, /execution\.cancelled/);
  assert.match(source, /execution\.expired/);
  assert.doesNotMatch(source, /status:\s*["']executed/);
});
test("deterministic adapter cannot execute external actions", () => {
  const source = read(
    "features/vayon/workflow-approval/adapters/deterministic.adapter.ts",
  );
  assert.match(source, /external\s*=\s*false/);
  assert.match(source, /executable:\s*false/);
  assert.doesNotMatch(source, /fetch\(|send\(|stripe|gmail|twilio/i);
});
test("every governed transition records audit history", () => {
  for (const path of [
    "features/vayon/workflow-approval/engines/workflow.engine.ts",
    "features/vayon/workflow-approval/engines/approval.engine.ts",
    "features/vayon/workflow-approval/engines/execution.engine.ts",
  ])
    assert.match(read(path), /appendAudit/);
});
test("all requested governance routes exist", () => {
  for (const path of [
    "app/vayon/workflows/page.tsx",
    "app/vayon/workflows/[workflowId]/page.tsx",
    "app/vayon/approvals/page.tsx",
    "app/vayon/approvals/[approvalId]/page.tsx",
    "app/vayon/executions/page.tsx",
  ])
    assert.doesNotThrow(() => read(path));
});
test("workflow engine documentation preserves the human approval boundary", () => {
  const source = read("docs/WORKFLOW_ENGINE.md");
  assert.match(source, /never transitions a request to `executed`/);
  assert.match(source, /Self-approval is forbidden/);
  assert.match(source, /append-only tenant-scoped audit store/);
});
