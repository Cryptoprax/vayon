import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("CRM exposes the enterprise operating-system navigation", async () => {
  const source = await read("features/vayon/crm-engine/components/CrmShell.tsx");
  for (const section of ["Organizations", "Leads", "Customers", "Companies", "Contacts", "Opportunities", "Activities", "Tasks", "Meetings", "Files", "Reports"]) {
    assert.match(source, new RegExp(section));
  }
});

test("the sales pipeline uses the existing governed mutation for drag and drop", async () => {
  const [page, board] = await Promise.all([
    read("app/vayon/deals/pipeline/page.tsx"),
    read("features/vayon/deal/components/DealBoard.tsx"),
  ]);
  assert.match(page, /PipelineService/);
  assert.match(board, /draggable/);
  assert.match(board, /onDrop/);
  assert.match(board, /moveDealStageAction/);
  assert.match(board, /Weighted/);
  assert.match(board, /Filter transactions by assigned agent/);
  assert.match(board, /Search property transactions/);
});

test("customer profiles include communications, revenue, history, and governed AI assistance", async () => {
  const source = await read("features/vayon/crm-engine/components/CrmLeadProfile.tsx");
  for (const section of ["emails", "calls", "whatsapp", "notes", "revenue", "pipeline history", "ai assistant"]) {
    assert.match(source, new RegExp(section, "i"));
  }
  for (const action of ["Summarize customer", "Generate follow-up", "Write proposal", "Generate email", "Meeting agenda", "Risk analysis", "Suggested next action"]) {
    assert.match(source, new RegExp(action));
  }
  assert.match(source, /recommendation only/i);
  assert.match(source, /No message, proposal, meeting, or CRM change is executed automatically/);
  assert.match(source, /\/vayon\/ai\/workforce\/sales-ai/);
});

test("sales dashboard aggregates existing production services in parallel", async () => {
  const [service, dashboard] = await Promise.all([
    read("features/vayon/crm-engine/services/crm.service.ts"),
    read("features/vayon/crm-engine/components/CrmDashboard.tsx"),
  ]);
  assert.match(service, /Promise\.all/);
  for (const dependency of ["PipelineService", "TaskService", "MeetingService"]) assert.match(service, new RegExp(dependency));
  for (const metric of ["Revenue", "Forecast", "Conversion", "Meetings", "Open tasks", "Pipeline", "Lead sources", "Top salespeople"]) {
    assert.match(dashboard, new RegExp(metric));
  }
});

test("Aurora demo workspace provides enterprise-scale sales records", async () => {
  const source = await read("features/vayon/demo-workspace/sales-operations/records.ts");
  for (const count of [300, 120, 500, 180, 240]) assert.match(source, new RegExp(`length:${count}`));
  for (const entity of ["auroraLeads", "auroraDeals", "auroraTasks", "auroraMeetings", "auroraDocuments"]) assert.match(source, new RegExp(entity));
});

test("production CRM remains tenant scoped and paginated", async () => {
  const [repository, leads] = await Promise.all([
    read("features/vayon/crm-engine/repositories/supabase-crm.repository.ts"),
    read("features/vayon/lead/repositories/lead.repository.ts"),
  ]);
  assert.match(repository, /organizationId/);
  assert.match(repository, /workspaceId/);
  assert.match(leads, /\.range\(/);
  assert.match(leads, /count:\s*"exact"/);
  assert.match(leads, /organization_id/);
  assert.match(leads, /workspace_id/);
});
