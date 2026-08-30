import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("executive board composes a unified evidence-backed morning brief", async () => {
  const source = await read("features/platform/ai-collaboration/components/ExecutiveCollaborationBoard.tsx");
  for (const label of ["Executive Collaboration Board", "Unified Morning Brief", "Sales", "Marketing", "Operations", "Finance", "Customer Success", "Top Priorities", "Key Risks", "Key Opportunities", "Expected Revenue", "Pending Decisions"])
    assert.match(source, new RegExp(label));
  for (const manager of ["Sarah", "Emma", "Alex", "David", "Olivia"]) assert.match(source, new RegExp(manager));
  assert.match(source, /Expected revenue is unavailable/);
});

test("board covers discussion conflicts ranking decisions timeline scorecard and insights", async () => {
  const source = await read("features/platform/ai-collaboration/components/ExecutiveCollaborationBoard.tsx");
  for (const label of ["Executive Discussion", "Conflict Detection", "Executive Decision Queue", "Originating AI manager", "Evidence", "Confidence", "Expected outcome", "Required approvals", "Related CRM records", "Executive Timeline", "Executive Scorecard", "Overall Business Health", "Board Insights", "Biggest Opportunity", "Biggest Risk", "Most Urgent Approval", "Most Valuable Property", "Most Valuable Buyer", "Most Valuable Deal"])
    assert.match(source, new RegExp(label));
  assert.match(source, /No automatic resolution is applied/);
  assert.match(source, /\/vayon\/approvals\?recommendation=/);
  assert.doesNotMatch(source, /onClick|setInterval|fetch\(/);
});

test("board route loads each existing collaboration and workforce projection once", async () => {
  const [page, dashboard] = await Promise.all([read("app/vayon/ai/collaboration/page.tsx"), read("features/vayon/dashboard/components/RealEstateIntelligence.tsx")]);
  assert.match(page, /ExecutiveCollaborationBoard data=\{data\} workforce=\{workforce\}/);
  assert.equal((page.match(/AICollaborationService\.production\(\)/g) ?? []).length, 1);
  assert.equal((page.match(/WorkforceService\.production\(\)/g) ?? []).length, 1);
  assert.match(dashboard, /href="\/vayon\/ai\/collaboration"/);
});
