import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Alex exposes the complete evidence-backed operations brief", async () => {
  const source = await read("features/vayon/operational-workforce/components/AlexOperationsManagerDashboard.tsx");
  for (const label of ["Today&apos;s Operations Brief", "Upcoming Viewings", "Pending Tasks", "Pending Approvals", "Registrations", "Document Status", "Operational Risks", "Upcoming Deadlines"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Evidence:/);
  assert.match(source, /Unavailable — supporting operational evidence is not connected/);
});

test("Alex covers coordination viewing documents workflows and insights", async () => {
  const source = await read("features/vayon/operational-workforce/components/AlexOperationsManagerDashboard.tsx");
  for (const label of ["Task Coordination", "Overdue Tasks", "High Priority Tasks", "Blocked Tasks", "Unassigned Tasks", "Duplicate Tasks", "Calendar Coordination", "Double Bookings", "Travel Gaps", "Viewing Management", "Document Readiness", "Workflow Monitor", "Operational Insights"])
    assert.match(source, new RegExp(label));
  for (const action of ["Schedule Viewing", "Collect Documents", "Approve Request", "Assign Task", "Reschedule Meeting", "Contact Buyer", "Contact Seller", "Escalate Issue"])
    assert.match(source, new RegExp(action));
  assert.match(source, /Expected Outcome/);
  assert.match(source, /Confidence/);
  assert.match(source, /\/vayon\/approvals\?intent=/);
  assert.doesNotMatch(source, /onClick|setInterval|fetch\(/);
});

test("Alex reuses the existing server-loaded workforce projection", async () => {
  const page = await read("app/vayon/ai/workforce/[employeeId]/page.tsx");
  assert.match(page, /employee === "operations-ai"/);
  assert.match(page, /AlexOperationsManagerDashboard tasks=\{result\.tasks\} activity=\{result\.activity\} recommendations=\{employeeRecommendations\} asOf=/);
  assert.equal((page.match(/WorkforceService\.production\(\)/g) ?? []).length, 1);
});
