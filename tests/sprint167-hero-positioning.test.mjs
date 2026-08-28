import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("hero uses the approved real estate positioning and conversion hierarchy", () => {
  const home = read("features/marketing/components/Homepage.tsx");
  for (const copy of [
    "Hire Your Entire AI Real Estate Team in Under 5 Minutes",
    "Powered by the World&apos;s Most Advanced AI Operating System for Real Estate",
    "Meet your complete AI workforce",
    "close more deals",
    "built exclusively for real estate professionals",
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
