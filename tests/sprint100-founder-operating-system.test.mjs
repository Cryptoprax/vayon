import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Founder Portal is a server-authorized hidden platform route", () => {
  const page = read("app/platform/founder/page.tsx");
  const context = read("features/platform/founder/services/founder-context.ts");
  const layout = read("app/platform/layout.tsx");
  const sidebar = read("features/dashboard/components/Sidebar.tsx");
  assert.match(page, /FounderAccessError/);
  assert.match(page, /notFound\(\)/);
  assert.match(context, /role === "founder"/);
  assert.match(context, /app_metadata/);
  assert.match(layout, /showFounder/);
  assert.match(sidebar, /founderOnly/);
});

test("Founder dashboard covers required executive surfaces without fabricated values", () => {
  const ui = read("features/platform/founder/components/FounderDashboard.tsx");
  const service = read("features/platform/founder/services/founder.service.ts");
  for (const value of ["Monthly Recurring Revenue", "Annual Recurring Revenue", "Today's Revenue", "Total Organizations", "Active AI Conversations", "Realtime activity", "Founder analytics", "Marketing overview", "Sales overview", "Founder AI", "System health", "Security", "Quick actions", "Recommendation only"]) assert.match(ui + service, new RegExp(value, "i"));
  assert.match(service, /value === null \? "unavailable"/);
  assert.doesNotMatch(service, /mock|faker|Math\.random/i);
});

test("Founder data preserves repository service boundaries and realtime is refresh-only", () => {
  const repository = read("features/platform/founder/repositories/founder.repository.ts");
  const service = read("features/platform/founder/services/founder.service.ts");
  const realtime = read("features/platform/founder/components/FounderRealtime.tsx");
  assert.match(service, /FounderRepository/);
  assert.match(repository, /platform_metrics/);
  assert.match(realtime, /postgres_changes/);
  assert.match(realtime, /router\.refresh/);
  assert.doesNotMatch(realtime, /insert\(|update\(|delete\(/);
});

test("Founder charts are lazy and responsive skeletons prevent layout shifts", () => {
  const lazy = read("features/platform/founder/components/LazyFounderCharts.tsx");
  const loading = read("app/platform/founder/loading.tsx");
  assert.match(lazy, /dynamic\(/);
  assert.match(lazy, /loading:/);
  assert.match(loading, /animate-pulse/);
  assert.ok(existsSync("docs/FOUNDER_OPERATING_SYSTEM.md"));
});
