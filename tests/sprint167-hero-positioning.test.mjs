import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("hero uses the approved AI operating system positioning and conversion hierarchy", () => {
  const home = read("features/marketing/components/Homepage.tsx");
  for (const copy of [
    "THE FUTURE OF INTELLIGENT BUSINESS",
    "One Intelligent AI Operating System.",
    "For Your Entire Business.",
    "Meet VAYON — an intelligent business operating system where AI employees work alongside your team to manage customer conversations, automate sales, coordinate operations, and turn everyday work into measurable progress.",
    "Build smarter workflows. Reduce repetitive work. Unlock the full potential of AI across your organization.",
    "Start Free",
    "Book a Demo",
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
