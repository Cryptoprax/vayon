import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("dashboard opens with a personalized evidence-based command center", () => {
  const center = read("features/vayon/dashboard/components/ExecutiveCommandCenter.tsx");
  const page = read("app/vayon/dashboard/page.tsx");
  for (const value of [
    "Good morning",
    "Today’s priorities",
    "AI insights",
    "Business health",
    "Tasks",
    "Next meeting",
    "Pending approvals",
    "Recent customer activity",
  ]) assert.match(center, new RegExp(value));
  assert.match(page, /AuthenticationService/);
  assert.match(page, /userName/);
});

test("AI insights derive only from dashboard evidence and disclose empty state", () => {
  const center = read("features/vayon/dashboard/components/ExecutiveCommandCenter.tsx");
  assert.match(center, /revenue\.trend/);
  assert.match(center, /data\.ai\.recommendations/);
  assert.match(center, /No metrics have been inferred/);
  assert.doesNotMatch(center, /Revenue is up 18|12 leads|ABC Ltd/);
  assert.doesNotMatch(center, /fetch\(|supabase|provider/i);
});

test("recommendations are contextual non-blocking and dismissible", () => {
  const center = read("features/vayon/dashboard/components/ExecutiveCommandCenter.tsx");
  for (const value of ["Import CRM", "Create your first campaign", "Generate a proposal", "Dismiss"]) assert.match(center, new RegExp(value));
  assert.match(center, /setDismissed/);
  assert.doesNotMatch(center, /role="dialog"|fixed inset-0/);
});

test("quick action center exposes all requested one-click workflows", () => {
  const actions = read("features/vayon/dashboard/components/QuickActions.tsx");
  for (const value of ["Create Contact", "Create Deal", "Create Campaign", "Generate Proposal", "Generate Image", "Generate Video", "Create AI Employee", "Launch Business"]) assert.match(actions, new RegExp(value));
});

test("KPI timeline and loading treatments are accessible and motion aware", () => {
  const source = [
    read("features/vayon/dashboard/components/KpiCard.tsx"),
    read("features/vayon/dashboard/components/ActivityTimeline.tsx"),
    read("app/vayon/dashboard/loading.tsx"),
  ].join("\n");
  for (const value of ["previous period", "Sparkline", "New contacts", "aria-busy", "motion-reduce"]) assert.match(source, new RegExp(value));
});

test("Founder view highlights cross-workspace commercial and AI evidence", () => {
  const founder = read("features/platform/founder/components/FounderDashboard.tsx");
  for (const value of ["Cross-workspace overview", "Revenue", "MRR", "ARR", "AI usage", "Workspace health", "Customer growth", "never presented as growth"]) assert.match(founder, new RegExp(value));
});
