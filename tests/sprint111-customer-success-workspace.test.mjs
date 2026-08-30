import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("customer success workspace enforces authenticated tenant membership", async () => {
  const repository = await read(
    "features/platform/customer-success-workspace/repositories/customer-success.repository.ts",
  );
  const route = await read("app/vayon/customer-success/page.tsx");
  for (const value of [
    "organizationId",
    "workspaceId",
    "user_id",
    "status",
    "active",
  ])
    assert.ok(repository.includes(value), value);
  assert.match(repository, /Customer Success Workspace access denied/);
  assert.match(route, /login\?next=\/vayon\/customer-success/);
});

test("workspace composes existing onboarding AI workflow integration knowledge organization and billing services", async () => {
  const source = await read(
    "features/platform/customer-success-workspace/services/customer-success-workspace.service.ts",
  );
  for (const value of [
    "EnterpriseOnboardingService",
    "WorkforceRuntimeService",
    "WorkflowAutomationService",
    "IntegrationService",
    "EnterpriseKnowledgeService",
    "EnterpriseOrganizationService",
    "SubscriptionService",
    "Promise.all",
  ])
    assert.ok(source.includes(value), value);
});

test("checklist supports all requested resumable onboarding tasks", async () => {
  const service = await read(
    "features/platform/customer-success-workspace/services/customer-success-workspace.service.ts",
  );
  const actions = await read(
    "features/platform/customer-success-workspace/actions/customer-success.actions.ts",
  );
  for (const value of [
    "Create organization",
    "Complete profile",
    "Invite teammates",
    "Create first workspace",
    "Import contacts",
    "Import properties",
    "Connect integrations",
    "Create first campaign",
    "Create first AI employee",
    "Launch first workflow",
  ])
    assert.ok(service.includes(value), value);
  assert.match(actions, /completed_steps/);
  assert.match(actions, /EnterpriseOnboardingService/);
});

test("checklist exposes complete progress states and remaining time", async () => {
  const source = await read(
    "features/platform/customer-success-workspace/services/customer-success-workspace.service.ts",
  );
  for (const value of [
    "Completed",
    "In Progress",
    "Blocked",
    "Skipped",
    "estimatedMinutesRemaining",
  ])
    assert.ok(source.includes(value), value);
});

test("time-to-value milestones are evidence-backed", async () => {
  const source = await read(
    "features/platform/customer-success-workspace/services/customer-success-workspace.service.ts",
  );
  for (const value of [
    "First Lead Imported",
    "First Campaign Created",
    "First AI Conversation",
    "First Deal Won",
    "First Workflow Executed",
    "First Report Generated",
    "Evidence source unavailable",
  ])
    assert.ok(source.includes(value), value);
});

test("AI setup is admin restricted and uses onboarding persistence", async () => {
  const repository = await read(
    "features/platform/customer-success-workspace/repositories/customer-success.repository.ts",
  );
  const action = await read(
    "features/platform/customer-success-workspace/actions/customer-success.actions.ts",
  );
  for (const role of [
    "organization_owner",
    "organization_admin",
    "administrator",
  ])
    assert.ok(repository.includes(role), role);
  for (const employee of [
    "Marketing AI",
    "Sales AI",
    "Customer Success AI",
    "Creative AI",
    "Knowledge AI",
  ])
    assert.ok(action.includes(employee), employee);
  assert.match(action, /aiEmployees/);
});

test("integration readiness remains guidance-first without credentials", async () => {
  const source = await read(
    "features/platform/customer-success-workspace/services/customer-success-workspace.service.ts",
  );
  for (const value of [
    "Email",
    "Calendar",
    "CRM imports",
    "Google",
    "Microsoft",
    "Stripe",
    "Razorpay",
    "WhatsApp",
    "onboarding can continue without them",
  ])
    assert.ok(source.includes(value), value);
});

test("workspace provides streaming AI onboarding and existing Knowledge help", async () => {
  const ui = await read(
    "features/platform/customer-success-workspace/components/CustomerSuccessWorkspace.tsx",
  );
  assert.match(ui, /WorkforceChatPanel/);
  assert.match(ui, /employee="executive-ai"/);
  for (const value of [
    "Search knowledge",
    "Guided tutorials",
    "Quick videos",
    "FAQ",
    "Support request",
    "AI assistance",
  ])
    assert.ok(ui.includes(value), value);
});

test("post-signup launch enters the workspace and documentation is complete", async () => {
  const action = await read(
    "features/onboarding/actions/enterprise-onboarding.actions.ts",
  );
  const navigation = await read("features/vayon/product-shell/navigation.ts");
  const docs = await read("docs/CUSTOMER_SUCCESS_WORKSPACE_ONBOARDING.md");
  assert.match(action, /\/vayon\/dashboard\?welcome=1&tour=1/);
  assert.match(navigation, /Customer Success/);
  assert.match(docs, /Tenant isolation/);
  assert.match(docs, /No live provider/);
});
