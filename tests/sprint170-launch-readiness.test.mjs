import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("first login introduces the AI company and remains accessible", () => {
  const source = read("features/onboarding/components/PremiumWelcomeExperience.tsx");
  for (const label of ["Building Your AI Real Estate Company", "Hiring Sales Manager", "Meet Your AI Team"])
    assert.match(source, new RegExp(label));
  assert.match(source, /Welcome to VAYON/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
});

test("first-login preparation remains skippable and workspace scoped", () => {
  const source = read("features/onboarding/components/PremiumWelcomeExperience.tsx");
  for (const stop of ["Hiring Marketing Director", "Hiring Property Advisor", "Preparing Workspace", "Training AI Team", "Connecting Intelligence"])
    assert.match(source, new RegExp(stop));
  assert.match(source, /workspaceName/);
  assert.match(source, />Skip</);
});

test("global help exposes every customer support destination", () => {
  const source = read("features/vayon/product-shell/ShellMenus.tsx");
  for (const label of ["Documentation", "Video Tutorials", "Contact Support", "Book Demo", "Report Issue", "Keyboard Shortcuts", "Send Feedback"])
    assert.match(source, new RegExp(label));
  assert.match(read("features/vayon/product-shell/ShellHeader.tsx"), /<HelpMenu visibility=\{visibility\}\/>/);
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
