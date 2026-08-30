import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("hero prioritizes demo conversion with visible trust", async () => {
  const source = await read("features/marketing/components/Homepage.tsx");
  assert.match(source, /Book Demo/);
  assert.match(source, /Watch 2-Minute Demo/);
  assert.match(source, /Start Free/);
  for (const value of [
    "Secure by design",
    "Human approval controls",
    "Cloud-native infrastructure",
  ])
    assert.match(source, new RegExp(value));
});

test("homepage tells the complete lead-to-revenue workflow", async () => {
  const source = await read("features/marketing/components/Homepage.tsx");
  for (const step of [
    "Lead enters",
    "AI qualifies",
    "Property matching",
    "Appointment booked",
    "Agent assigned",
    "Follow up",
    "Offer sent",
    "Deal won",
  ])
    assert.match(source, new RegExp(step));
});

test("product preview covers launch modules and one AI employee presentation", async () => {
  const [homepage, experience] = await Promise.all([
    read("features/marketing/components/Homepage.tsx"),
    read("features/marketing/components/EnterpriseExperience.tsx"),
  ]);
  for (const view of [
    "CRM",
    "AI Employees",
    "Pipeline",
    "Analytics",
    "Calendar",
    "Automation",
  ])
    assert.match(experience, new RegExp(view));
  assert.match(homepage, /<AiTeamGrid \/>/);
  assert.doesNotMatch(homepage, /ConversionWorkforce/);
});

test("interactive ROI calculator uses transparent requested inputs and outputs", async () => {
  const source = await read(
    "features/marketing/components/LandingRoiCalculator.tsx",
  );
  for (const value of [
    "Monthly leads",
    "Conversion rate",
    "Revenue per deal",
    "Revenue increase",
    "Hours saved",
    "AI cost savings",
    "Pipeline growth",
  ])
    assert.match(source, new RegExp(value));
  assert.match(source, /directional/i);
  assert.match(source, /not guarantees/i);
});

test("customer proof is launch-ready without fabricated endorsements", async () => {
  const source = await read("features/marketing/components/Homepage.tsx");
  assert.match(source, /hasCustomerTestimonials = false/i);
  assert.match(source, /Why Real Estate Teams Choose VAYON/i);
  assert.doesNotMatch(source, /pending customer approval/i);
  assert.doesNotMatch(source, /pending verification/i);
});

test("footer has complete information architecture and functional newsletter capture", async () => {
  const source = await read("features/marketing/components/MarketingShell.tsx");
  for (const value of [
    "Platform",
    "Solutions",
    "Resources",
    "Solutions for",
    "Legal",
    "Social",
    "VAYON product notes",
  ])
    assert.match(source, new RegExp(value));
  assert.match(source, /captureLeadAction/);
  assert.match(source, /name="kind" value="newsletter"/);
});

test("Sprint 72.2 remains frontend-only", async () => {
  const source = await read("docs/SPRINT_72_2_LANDING_CONVERSION.md");
  assert.doesNotMatch(source, /new database|new API|authentication change/i);
});
