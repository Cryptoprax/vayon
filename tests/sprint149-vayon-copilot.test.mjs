import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Copilot is persistent, responsive, and connected to the global shortcut", () => {
  const shell = read("features/vayon/components/ProductExperience.tsx");
  const copilot = read("features/vayon/intelligence-core/components/VayonIntelligence.tsx");
  const bar = read("features/vayon/universal-bar/components/UniversalBar.tsx");
  assert.match(shell, /VayonIntelligence/);
  assert.match(copilot, /Real Estate Assistant/);
  assert.match(copilot, /Property, client and transaction guidance/);
  assert.match(copilot, /max-md:rounded-t-3xl/);
  assert.match(bar, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(bar, /vayon:copilot:open/);
});

test("natural-language commands launch existing governed module routes", () => {
  const commands = read("features/vayon/intelligence-core/copilot-commands.ts");
  for (const value of [
    "proposal", "campaign", "summary", "overdue opportunities", "ai sales employee",
    "pitch deck", "top performing campaigns", "Open Tasks", "Open CRM", "founder",
    "/vayon/crm", "/vayon/creative/documents", "/vayon/creative/images", "/vayon/creative/videos",
    "/onboarding/business-launch", "/platform/founder", "/vayon/analytics",
  ]) assert.match(commands, new RegExp(value));
  assert.match(commands, /nothing has been created or executed yet/);
});

test("Copilot exposes only route-derived context and never fabricates metrics", () => {
  const copilot = read("features/vayon/intelligence-core/components/VayonIntelligence.tsx");
  const commands = read("features/vayon/intelligence-core/copilot-commands.ts");
  for (const value of ["Page ·", "Workspace ·", "Module ·", "Selected record ·"]) assert.match(copilot, new RegExp(value));
  assert.match(commands, /No verified business metrics/);
  assert.match(commands, /not infer revenue, activity, or performance/);
  assert.doesNotMatch(commands + copilot, /fetch\(|supabase|database|provider call/i);
});

test("recommendations and empty-state help remain dismissible and nonblocking", () => {
  const copilot = read("features/vayon/intelligence-core/components/VayonIntelligence.tsx");
  const success = read("features/vayon/intelligence-core/success-engine.ts");
  assert.match(copilot, /Dismiss \$\{proactive\.title\}/);
  assert.match(copilot, /setDismissedRecommendation/);
  assert.match(success, /snapshot\.emptyState/);
  assert.match(success, /This workspace is ready, but this page has no records to show/);
});

test("command palette supports smart scopes, recent commands, pins, suggestions, and keyboard navigation", () => {
  const bar = read("features/vayon/universal-bar/components/UniversalBar.tsx");
  for (const value of ["projects", "contacts", "companies", "deals", "campaigns", "employees", "documents", "creative-assets", "settings", "recent", "pinned", "ArrowDown", "ArrowUp", "Ask Copilot"]) assert.match(bar, new RegExp(value));
});

test("executive brief options disclose missing evidence", () => {
  const copilot = read("features/vayon/intelligence-core/components/VayonIntelligence.tsx");
  for (const value of ["Morning Brief", "Afternoon Brief", "End of Day Summary", "disclose missing evidence"]) assert.match(copilot, new RegExp(value));
});

test("Copilot uses VDS controls, accessible semantics, and reduced motion", () => {
  const copilot = read("features/vayon/intelligence-core/components/VayonIntelligence.tsx");
  assert.match(copilot, /Button/);
  assert.match(copilot, /aria-label="Real Estate Assistant"/);
  assert.match(copilot, /aria-live="polite"/);
  assert.match(copilot, /motion-reduce:transition-none/);
});
