import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const model = read("features/vayon/autonomous-workforce/model.ts");
const views = read("features/vayon/autonomous-workforce/AutonomousWorkforceViews.tsx");
const nav = read("features/vayon/product-shell/navigation.ts");

test("Sprint 220 exposes work queue, goals, strategy and automations", () => {
  for (const route of ["/vayon/ai/work-queue", "/vayon/ai/goals", "/vayon/ai/automations"]) assert.match(nav, new RegExp(route.replaceAll("/", "\\/")));
  for (const surface of ["Today&apos;s AI Work", "AI employee activity", "Executive strategy", "Smart automations"]) assert.ok(views.includes(surface));
});

test("all required autonomous intelligence domains are represented", () => {
  for (const domain of ["Property intelligence", "Lead intelligence", "Campaign intelligence", "Customer success intelligence"]) assert.ok(model.includes(domain));
  for (const employee of ["Sarah", "Emma", "Alex", "David", "Olivia"]) assert.ok(model.includes(employee));
});

test("autonomous outcomes remain approval gated and progress is not fabricated", () => {
  assert.match(views, /External actions never run without approval/);
  assert.match(views, /Progress is reported only when the workflow runtime provides it/);
  assert.match(views, /always require Approval Center review/);
  assert.doesNotMatch(views, /setInterval|setTimeout|Math\.random/);
});

test("dashboard reuses the shared work queue", () => {
  const dashboard = read("features/vayon/dashboard/components/DashboardShell.tsx");
  assert.match(dashboard, /<AIWorkQueue compact \/>/);
});
