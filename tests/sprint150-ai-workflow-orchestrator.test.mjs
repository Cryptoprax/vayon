import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("workflow planner contracts are planning-only and non-executable", () => {
  const contracts = read("features/vayon/workflow-orchestrator/contracts.ts");
  const templates = read("features/vayon/workflow-orchestrator/templates.ts");
  for (const value of ["dependencies", "status", "estimatedMinutes", "approvalRequired", "executable: false"]) assert.match(contracts + templates, new RegExp(value));
  assert.doesNotMatch(contracts + templates, /fetch\(|supabase|provider|database|execute\(/i);
});

test("catalog provides every requested reusable workflow template", () => {
  const templates = read("features/vayon/workflow-orchestrator/templates.ts");
  for (const value of ["Launch Business", "Generate Investor Pitch", "Launch Marketing Campaign", "Import CRM", "Create AI Sales Team", "Employee Onboarding", "Customer Success Setup", "Sales Pipeline Initialization", "Content Marketing", "Lead Generation", "Proposal Creation", "Business Review"]) assert.match(templates, new RegExp(value));
});

test("launch business spans all required outputs and existing modules", () => {
  const templates = read("features/vayon/workflow-orchestrator/templates.ts");
  for (const value of ["Business Launch", "Brand identity", "CRM", "AI Employees", "Marketing Campaign", "Website", "Investor Pitch", "Sales Pipeline", "Creative Studio", "Campaign Studio", "Documents", "Images", "Videos", "Founder Dashboard", "Analytics", "AI Workforce", "Knowledge", "Notifications"]) assert.match(templates, new RegExp(value));
});

test("preview includes summary outputs requirements warnings time confirmation and cancellation", () => {
  const component = read("features/vayon/workflow-orchestrator/components/WorkflowOrchestrator.tsx");
  for (const value of ["Workflow preview", "Modules affected", "Expected output", "Missing requirements", "Warnings", "Estimated completion time", "Additional information is required", "Confirm plan", "Cancel", "No autonomous execution"]) assert.match(component, new RegExp(value));
  assert.match(component, /No steps were executed/);
});

test("premium timeline exposes every governed status and zero initial progress", () => {
  const source = read("features/vayon/workflow-orchestrator/components/WorkflowOrchestrator.tsx");
  for (const value of ["completed", "current", "waiting-for-approval", "blocked", "upcoming", "Progress 0%", "Approval required"]) assert.match(source, new RegExp(value));
});

test("local plan controls support save duplicate share export favorite and history", () => {
  const source = read("features/vayon/workflow-orchestrator/components/WorkflowOrchestrator.tsx");
  for (const value of ["Save", "Duplicate", "Share", "Export", "Favorite", "Execution history", "cancelled", "approval-confirmed", "Timestamp", "Duration", "localStorage"]) assert.match(source, new RegExp(value));
});

test("Copilot and command palette open the preview-first workflow planner", () => {
  const commands = read("features/vayon/intelligence-core/copilot-commands.ts");
  const actions = read("features/vayon/universal-bar/config/quick-create.ts");
  for (const value of ["Create Workflow", "Run Workflow", "Duplicate Workflow", "Search Workflow"]) assert.match(actions, new RegExp(value));
  assert.match(commands, /Open Workflow Planner/);
  assert.match(commands, /Preview Launch Business Workflow/);
  assert.match(commands + actions, /\/vayon\/workflows/);
});

test("orchestrator route preserves the existing governed workflow foundation", () => {
  const page = read("app/vayon/workflows/page.tsx");
  assert.match(page, /WorkflowOrchestrator/);
  assert.match(page, /WorkflowAutomationDashboard/);
  assert.match(page, /WorkflowDesigner/);
  assert.match(page, /Runtime execution remains separately permissioned and approval-governed/);
});
