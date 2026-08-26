import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const adaptive = read("features/vayon/adaptive-workspace/AdaptiveWorkspace.tsx");

test("supported businesses receive short first-value journeys and one primary objective", () => {
  for (const business of ["real estate", "marketing agency", "construction", "healthcare", "retail"]) assert.ok(adaptive.includes(business));
  for (const match of adaptive.matchAll(/journey:\s*\[(.*?)\], modules:/gs)) assert.ok((match[1].match(/id:/g) ?? []).length <= 5);
  assert.match(adaptive, /Your recommended objective/);
  assert.match(adaptive, /find\(\(item\) => !isComplete\(item\)\)/);
});

test("progress, samples, one contextual hint, and success moments are present", () => {
  assert.match(adaptive, /ready to launch/);
  assert.match(adaptive, /Open Sample Workspace/);
  assert.equal((adaptive.match(/aria-label=\"Contextual hint\"/g) ?? []).length, 1);
  assert.match(adaptive, /Dismiss hint/);
  assert.match(adaptive, /First campaign created/);
});

test("internal TTFV instrumentation covers every requested milestone", () => {
  const eventSource = read("features/vayon/ttfv/ttfv-events.ts");
  const observer = read("features/vayon/ttfv/TTFVObserver.tsx");
  for (const milestone of ["workspace_created", "first_ai_employee", "first_crm_contact", "first_campaign", "first_proposal", "first_upgrade"]) assert.match(`${eventSource}\n${observer}`, new RegExp(milestone));
  assert.match(eventSource, /localStorage/);
});

test("priority empty states recommend an action and route", () => {
  for (const file of ["features/vayon/property-platform/components/PropertyViews.tsx", "features/vayon/calendar-platform/components/CalendarViews.tsx", "features/vayon/communications-workspace/components/CommunicationViews.tsx"]) {
    const source = read(file);
    assert.doesNotMatch(source, /No (?:properties|records|conversations|timeline items|campaign data|governed notifications) (?:are|is) available/);
    assert.match(source, /href=/);
  }
});
