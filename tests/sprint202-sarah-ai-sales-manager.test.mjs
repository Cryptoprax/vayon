import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Sarah exposes the complete evidence-backed morning sales briefing", async () => {
  const source = await read("features/platform/sales-ai/components/SarahSalesManagerDashboard.tsx");
  for (const label of ["Good Morning", "Today’s Priorities", "Expected Closings", "Urgent Buyers", "Urgent Sellers", "Follow-ups Due", "Viewings", "Registrations", "Pending Approvals", "Revenue Forecast"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Evidence:/);
  assert.match(source, /Unavailable — supporting repository evidence is not connected/);
});

test("Sarah covers lead coaching pipeline property executive and risk management", async () => {
  const source = await read("features/platform/sales-ai/components/SarahSalesManagerDashboard.tsx");
  for (const label of ["Lead Prioritization", "Recommended agent", "Agent Coaching", "Pipeline Health", "Property Advisor", "Executive Insights", "Risk Center", "Supporting evidence", "Expected outcome", "Confidence", "Alternative"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Prepare for approval/);
  assert.doesNotMatch(source, /onClick|setInterval|fetch\(/);
});

test("Sarah reuses Sales Copilot and request-local deterministic projection caching", async () => {
  const [dashboard, service] = await Promise.all([
    read("features/platform/sales-ai/components/SalesAIDashboard.tsx"),
    read("features/platform/sales-ai/services/sales-ai.service.ts"),
  ]);
  assert.match(dashboard, /SarahSalesManagerDashboard/);
  assert.match(service, /WeakMap<object, SalesAIDashboard>/);
  assert.match(service, /projectionCache\.get/);
  assert.match(service, /projectionCache\.set/);
  assert.equal((service.match(/this\.repository\.evidence\(\)/g) ?? []).length, 2);
});
