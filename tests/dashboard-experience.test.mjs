import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("enterprise dashboard route uses the tenant scoped server service", () => {
  const page = read("app/vayon/dashboard/page.tsx");
  assert.match(page, /ExecutiveDashboardService/);
  assert.match(page, /DashboardShell/);
  assert.doesNotMatch(page, /use client/);
});

test("dashboard composes every requested business surface", () => {
  const shell = read("features/vayon/dashboard/components/DashboardShell.tsx");
  for (const component of ["AICommandBar", "RealEstateKpiGrid", "RevenueChartLoader", "PipelineBoard", "AIWorkforceGrid", "CalendarWidget", "ActivityTimeline", "WhatsAppConversations", "QuickActions"]) assert.match(shell, new RegExp(component));
});

test("dashboard data remains tenant scoped without fallback metrics", () => {
  const service = read("features/vayon/dashboard/services/executive-dashboard.service.ts");
  assert.match(service, /organization_id/);
  assert.match(service, /workspace_id/);
  assert.match(service, /ai_employees/);
  assert.match(service, /channel", "whatsapp/);
  assert.doesNotMatch(service, /4\.25|1\.8 Cr/);
});

test("dashboard preserves the product shell and is the canonical authenticated landing route", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  assert.match(navigation, /label: "Dashboard", href: "\/vayon\/dashboard"/);
  assert.doesNotMatch(navigation, /href: "\/vayon\/home"/);
  assert.match(read("app/vayon/layout.tsx"), /VayonShell/);
});

test("dashboard actions use VDS and responsive layouts", () => {
  const files = ["AICommandBar.tsx", "AIWorkforceGrid.tsx", "WhatsAppConversations.tsx", "DashboardShell.tsx"].map((file) => read(`features/vayon/dashboard/components/${file}`)).join("\n");
  assert.match(files, /features\/platform\/design-system/);
  for (const breakpoint of ["sm:", "xl:", "2xl:"]) assert.match(files, new RegExp(breakpoint));
  assert.doesNotMatch(files, /<button\b/);
});
