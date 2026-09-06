import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("executive KPI bar exposes every required real estate signal without fabrication", async () => {
  const source = await read("features/vayon/dashboard/components/RealEstateKpiGrid.tsx");
  for (const label of ["Revenue Pipeline", "Active Listings", "Pending Deals", "Closed Deals", "Tasks Due Today", "Pending Approvals", "Hot Opportunities", "Website Visits Today"])
    assert.match(source, new RegExp(label));
  assert.equal((source.match(/\{ label: /g) ?? []).length, 8);
  assert.doesNotMatch(source, /Unavailable|Not enough authoritative data|Active Buyers|Active Sellers|Conversion Rate|Commission Pipeline/);
  assert.match(source, /sm:grid-cols-2 lg:grid-cols-4/);
  assert.doesNotMatch(source, /2xl:grid-cols-8|truncate|fetch\(/);
  assert.match(source, /Executive Overview/);
  assert.match(source, /Building Insights/);
  assert.match(source, /sm:col-span-2/);
  assert.match(source, /hasHistory && item.trend/);
  assert.doesNotMatch(source, /Partial visibility|Trend appears with comparable history/);
  assert.match(source, /recent notifications/);
  assert.match(source, /View Complete Business Analytics/);
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
