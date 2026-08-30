import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("David exposes an evidence-safe executive finance dashboard", async () => {
  const source = await read("features/vayon/operational-workforce/components/DavidFinanceManagerDashboard.tsx");
  for (const label of ["Today&apos;s Financial Brief", "Revenue Pipeline", "Expected Revenue", "Pending Revenue", "Expected Commission", "Released Commission", "Pending Commission", "Outstanding Payments", "Outstanding Receivables", "Upcoming Closings", "Financial Risks", "Cash Flow Indicators"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Evidence:/);
  assert.match(source, /Unavailable — supporting finance evidence is not connected/);
});

test("David covers commissions forecasts payments profitability risks and summaries", async () => {
  const source = await read("features/vayon/operational-workforce/components/DavidFinanceManagerDashboard.tsx");
  for (const label of ["Commission Analytics", "Commission earned", "Commission delayed", "Revenue Forecast", "Quarterly Forecast", "Revenue At Risk", "High Confidence Closings", "Low Confidence Closings", "Payment Intelligence", "Profitability", "Financial Executive Summary", "Expected Outcome", "Confidence"])
    assert.match(source, new RegExp(label));
  for (const action of ["Follow-up Payment", "Review Commission", "Prepare Settlement", "Verify Transaction", "Approve Financial Request", "Collect Outstanding Documents"])
    assert.match(source, new RegExp(action));
  assert.match(source, /\/vayon\/approvals\?intent=/);
  assert.doesNotMatch(source, /onClick|setInterval|fetch\(/);
});

test("David reuses one existing Sales AI projection and server-loaded workforce evidence", async () => {
  const page = await read("app/vayon/ai/workforce/[employeeId]/page.tsx");
  assert.match(page, /employee === "sales-ai" \|\| employee === "finance-ai"/);
  assert.match(page, /DavidFinanceManagerDashboard sales=\{salesDashboard\} tasks=\{result\.tasks\} recommendations=\{employeeRecommendations\}/);
  assert.equal((page.match(/SalesAIService\.production\(\)/g) ?? []).length, 1);
  assert.equal((page.match(/WorkforceService\.production\(\)/g) ?? []).length, 1);
});
