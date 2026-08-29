import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("executive KPI bar exposes every required real estate signal without fabrication", async () => {
  const source = await read("features/vayon/dashboard/components/RealEstateKpiGrid.tsx");
  for (const label of ["Revenue Pipeline", "Active Listings", "Active Buyers", "Active Sellers", "Pending Deals", "Closed Deals", "Today's Site Visits", "Tasks Due Today", "Commission Pipeline", "Average Response Time", "Conversion Rate", "Average Days to Close", "Lead Response SLA", "Listings Pending Approval", "Marketing Qualified Leads", "Hot Opportunities"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Unavailable/);
  assert.match(source, /Not enough authoritative data/);
});

test("sales pipeline covers the complete operational lifecycle", async () => {
  const [service, board] = await Promise.all([
    read("features/vayon/dashboard/services/executive-dashboard.service.ts"),
    read("features/vayon/dashboard/components/PipelineBoard.tsx"),
  ]);
  for (const stage of ["New Leads", "Qualified", "Viewing Scheduled", "Negotiation", "Booking", "Registration", "Completed", "Lost"])
    assert.match(service, new RegExp(stage));
  for (const value of ["item.count", "item.value", "item.trend", "Owner · Unavailable"])
    assert.match(board, new RegExp(value.replace(".", "\\.")));
});

test("command center includes evidence-only portfolio people agent and market intelligence", async () => {
  const source = await read("features/vayon/dashboard/components/RealEstateIntelligence.tsx");
  for (const heading of ["AI business insights", "AI command center", "Property intelligence", "Buyer intelligence", "Seller intelligence", "Agent performance", "Market intelligence", "Today's Priorities", "Recommended Actions", "Risk Alerts", "Growth Opportunities", "Urgent Tasks"])
    assert.match(source, new RegExp(heading));
  assert.match(source, /Evidence:/);
  assert.match(source, /Market data unavailable/);
  assert.doesNotMatch(source, /Math\.random|faker|mock/i);
});

test("dashboard keeps one parallel server load and responsive agenda and timeline", async () => {
  const [page, shell, agenda] = await Promise.all([
    read("app/vayon/dashboard/page.tsx"),
    read("features/vayon/dashboard/components/DashboardShell.tsx"),
    read("features/vayon/dashboard/components/CalendarWidget.tsx"),
  ]);
  assert.match(page, /Promise\.all/);
  assert.match(shell, /RealEstateIntelligence/);
  assert.match(shell, /ActivityTimeline/);
  assert.match(agenda, /Today&apos;s Agenda/);
  assert.match(agenda, /Appointments · Viewings · Follow-ups · Calls · Meetings · Registrations · Deadlines/);
});
