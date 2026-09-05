import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("dashboard welcome and workspace completion are workspace scoped and evidence based", () => {
  const welcome = read("features/onboarding/components/PremiumWelcomeExperience.tsx");
  const completion = read("features/vayon/dashboard/components/GettingStartedChecklist.tsx");
  assert.match(welcome, /workspaceName/);
  assert.match(welcome, /localStorage\.setItem/);
  assert.match(welcome, /Skip/);
  for (const value of ["Workspace completion", "percentage", "properties", "leads", "whatsappConversations", "activities"])
    assert.match(completion, new RegExp(value));
});

test("major customer modules use shared skeleton loading boundaries", () => {
  for (const route of ["dashboard", "crm", "properties", "leads", "tasks", "analytics", "creative", "notifications", "approvals"])
    assert.equal(existsSync(`app/vayon/${route}/loading.tsx`), true, route);
  const states = read("features/vayon/components/RouteStates.tsx");
  assert.match(states, /Skeleton/);
  assert.doesNotMatch(states, /LoaderCircle|animate-spin/);
  assert.match(states, /aria-busy/);
});

test("recoverable errors are friendly and never expose technical details", () => {
  const states = read("features/vayon/components/RouteStates.tsx");
  for (const value of ["Retry", "Go Back", "Contact Support", "Your data is safe"])
    assert.match(states, new RegExp(value));
  assert.doesNotMatch(states, /error\.message|error\.stack|NEXT_REDIRECT|supabase|database error/i);
});

test("empty states and feedback use shared accessible UX primitives", () => {
  const empty = read("features/vayon/components/SmartEmptyState.tsx");
  const toast = read("features/vayon/components/ShellFeedbackToast.tsx");
  for (const value of ["Sparkles", "primaryLabel", "secondaryActions", "ButtonLink"])
    assert.match(empty, new RegExp(value));
  assert.match(toast, /tone !== "success"/);
  assert.match(toast, /5000/);
  assert.match(toast, /Dismiss notification/);
  assert.match(toast, /tone="danger"|tone={tone}/);
});

test("beta checklist certifies navigation forms accessibility responsive and production audits", () => {
  const checklist = read("docs/BETA_READINESS_CHECKLIST.md");
  for (const section of ["UX checklist", "Navigation checklist", "Loading checklist", "Accessibility checklist", "Production readiness checklist"])
    assert.match(checklist, new RegExp(section));
  for (const script of ["scripts/audit-route-integrity.mjs", "scripts/audit-interaction-reliability.mjs", "scripts/audit-mutation-reliability.mjs", "scripts/audit-ux-simplification.mjs", "scripts/audit-commercial-readiness.mjs", "scripts/audit-production-readiness.mjs"])
    assert.equal(existsSync(script), true, script);
});
