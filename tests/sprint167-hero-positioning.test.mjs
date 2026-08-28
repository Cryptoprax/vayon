import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("hero uses the approved real estate positioning and conversion hierarchy", () => {
  const home = read("features/marketing/components/Homepage.tsx");
  for (const copy of [
    "The World&apos;s Most Advanced AI Operating System for Real Estate",
    "Run your entire real estate business from one intelligent",
    "growth—all in",
    "one place.",
    "built specifically for modern real estate companies.",
    "The complete AI platform for modern real estate companies",
    "Start Free Trial",
    "Watch 2-Minute Demo",
    "Book Live Demo",
  ])
    assert.match(home, new RegExp(copy));
});

test("existing hero preview emphasizes the six approved real estate views", () => {
  const preview = read(
    "features/marketing/components/EnterpriseExperience.tsx",
  );
  for (const view of [
    "Property Pipeline",
    "AI Employees",
    "Property Listings",
    "Lead Qualification",
    "Appointments",
    "Executive Dashboard",
  ])
    assert.match(preview, new RegExp(view));
  assert.match(preview, /export function HeroProductMockup/);
});
