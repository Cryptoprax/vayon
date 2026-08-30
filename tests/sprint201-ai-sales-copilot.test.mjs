import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Sales Copilot remains evidence based and approval governed", async () => {
  const [service, types] = await Promise.all([
    read("features/platform/sales-ai/services/sales-ai.service.ts"),
    read("features/platform/sales-ai/types/index.ts"),
  ]);
  for (const value of ["dailyPriorities", "conversationSummary", "actionItems", "risks", "nextSteps", "pendingQuestions", "missingInformation", "approvalRequired", "executable"])
    assert.match(`${service}\n${types}`, new RegExp(value));
  for (const action of ["call", "whatsapp", "email", "schedule_viewing", "send_brochure", "prepare_offer", "request_documents", "mortgage_follow_up", "registration_follow_up"])
    assert.match(types, new RegExp(action));
  assert.match(service, /executable: false/);
  assert.match(service, /approvalHref: `\/vayon\/approvals/);
});

test("Sales AI runtime reuses one repository evidence read", async () => {
  const service = await read("features/platform/sales-ai/services/sales-ai.service.ts");
  const runtime = service.slice(service.indexOf("async runtimeContext"));
  assert.equal((runtime.match(/this\.repository\.evidence\(\)/g) ?? []).length, 1);
  assert.doesNotMatch(runtime, /this\.dashboard\(\)/);
});

test("copilot UI covers daily priorities conversations and entity assistants", async () => {
  const [dashboard, property, transaction] = await Promise.all([
    read("features/platform/sales-ai/components/SalesAIDashboard.tsx"),
    read("features/vayon/crm-automation/PropertyCrmSummary.tsx"),
    read("features/vayon/deal/components/DealWorkspaceContent.tsx"),
  ]);
  for (const label of ["Next Best Actions", "Conversation summary", "Follow-up detection", "Missing information", "Approval required"]) assert.match(dashboard, new RegExp(label, "i"));
  for (const label of ["Property Sales Copilot", "Prepare Brochure", "Prepare Viewing", "Prepare Offer"]) assert.match(property, new RegExp(label));
  for (const label of ["Transaction Sales Copilot", "Request Documents", "Mortgage Follow-up", "Registration Follow-up"]) assert.match(transaction, new RegExp(label));
});
