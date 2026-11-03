import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const center = read("features/marketing/components/CommandCenter.tsx");
const glow = read("features/marketing/components/HeroGlow.tsx");
const homepage = read("features/marketing/components/Homepage.tsx");
const css = read("features/marketing/components/homepage-motion.module.css");

test("the hero renders the AI Business Command Center with the six approved areas", () => {
  assert.match(homepage, /<CommandCenter \/>/);
  assert.doesNotMatch(homepage, /<HeroProductMockup \/>/);
  for (const area of ["AI Employees", "Sales Pipeline", "Customer Engagement", "Marketing Automation", "Business Operations", "Analytics"])
    assert.match(center, new RegExp(`label: "${area}"`));
  assert.match(center, /AI Business Command Center/);
});

test("every simulated number and activity is labelled as illustrative demo data", () => {
  assert.match(center, /Illustrative demo data/);
  assert.match(center, /Illustrative demo data, not real customer activity/);
  assert.match(center, /aria-label="Illustrative AI team activity"/);
  assert.match(center, /an illustrative product demo/);
  assert.doesNotMatch(center, /\bLive workspace\b|\bConnected\b|real-time|customers? (?:love|trust)/i);
  // No personal names, company names or currency amounts that could read as real customer activity.
  assert.doesNotMatch(center, /Sarah|Emma|Alex|Olivia|David|Inc\.|Ltd|\$\d|₹|€/);
});

test("motion respects reduced motion, visibility and an explicit pause control", () => {
  assert.match(center, /useReducedMotion/);
  assert.match(center, /running = inView && pageVisible && !paused && !held && !reduced/);
  assert.equal((center.match(/useLoop\(running,/g) || []).length, 3, "every timer is gated by the shared running condition");
  assert.equal((center.match(/setInterval/g) || []).length, 1, "only the shared loop helper creates an interval");
  assert.match(center, /visibilitychange/);
  assert.match(center, /aria-pressed=\{paused\}/);
  assert.match(center, /Pause the demo animation/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(glow, /useReducedMotion/);
  assert.match(glow, /\(hover: hover\) and \(pointer: fine\)/);
});

test("the area switcher is an accessible tablist with keyboard support and no live-region noise", () => {
  for (const pattern of [/role="tablist"/, /role="tab"/, /role="tabpanel"/, /aria-selected=\{selected\}/, /aria-controls=/, /tabIndex=\{selected \? 0 : -1\}/, /ArrowDown/, /ArrowLeft/, /"Home"/, /"End"/])
    assert.match(center, pattern);
  assert.doesNotMatch(center, /aria-live/);
});

test("the hero headline stays readable to assistive technology and paints without waiting for motion", () => {
  assert.match(homepage, /<span className="sr-only">\{heroHeadline\.join\(" "\)\}<\/span>/);
  assert.match(homepage, /<span aria-hidden="true">/);
  assert.match(css, /from \{\s*opacity: 0\.25;/, "the word reveal never starts fully transparent");
});

test("the demo stays a presentational client component with no data access", () => {
  for (const component of [center, glow]) {
    assert.doesNotMatch(component, /fetch\(|innerHTML|dangerouslySetInnerHTML|supabase|localStorage|document\.cookie/i);
    assert.match(component, /^"use client";/);
  }
});
