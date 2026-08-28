import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("first login offers exactly the three approved choices", () => {
  const source = read("features/onboarding/components/PremiumWelcomeExperience.tsx");
  for (const label of ["Explore Demo Workspace", "Create My Workspace", "Watch 2-Minute Product Tour"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Welcome to VAYON/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
});

test("product tour covers the launch journey and remains skippable", () => {
  const source = read("features/onboarding/components/PremiumWelcomeExperience.tsx");
  for (const stop of ["Dashboard", "CRM", "Properties", "AI Employees", "Marketing", "Calendar", "Communications", "Billing"])
    assert.match(source, new RegExp(`\\["${stop}"`));
  assert.match(source, /Skip tour/);
  assert.match(source, /You&apos;re ready to start using VAYON\./);
});

test("global help exposes every customer support destination", () => {
  const source = read("features/vayon/product-shell/ShellMenus.tsx");
  for (const label of ["Documentation", "Video Tutorials", "Contact Support", "Book Demo", "Report Issue", "Keyboard Shortcuts", "Send Feedback"])
    assert.match(source, new RegExp(label));
  assert.match(read("features/vayon/product-shell/ShellHeader.tsx"), /<HelpMenu\/>/);
});

test("shared loading and error states are friendly and actionable", () => {
  const states = read("features/vayon/components/RouteStates.tsx");
  assert.match(states, /Retry/);
  assert.match(states, /Go Back/);
  assert.match(states, /Contact Support/);
  assert.match(states, /aria-busy="true"/);
  assert.doesNotMatch(states, /error\.message|stack|digest/);
});

test("the complete public trust surface exists", () => {
  for (const route of ["security", "privacy", "data-ownership", "status", "help"])
    assert.equal(existsSync(`app/(marketing)/${route}/page.tsx`), true, `${route} page missing`);
});
