import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const publicMarketing = () =>
  [
    read("features/marketing/components/Homepage.tsx"),
    read("features/marketing/components/MarketingShell.tsx"),
    read("features/marketing/repositories/marketing-assets.repository.ts"),
    read("features/marketing/repositories/marketing.repository.ts"),
  ].join("\n");

test("public positioning preserves real estate while supporting the commercial catalog", () => {
  const source = publicMarketing();
  assert.match(source, /AI Operating System/);
  assert.match(source, /Real Estate/);
});

test("navigation links directly to the focused real estate solutions experience", () => {
  const source = read("features/marketing/components/MarketingShell.tsx");
  for (const item of [
    "Platform",
    "Solutions",
    "AI Employees",
    "Pricing",
    "Resources",
    "Book Demo",
    "Start Free",
  ])
    assert.match(source, new RegExp(item));
  assert.match(source, /label: "Solutions", href: "\/solutions"/);
  assert.doesNotMatch(
    source,
    /label: "Industries"|realEstateSolutions|solutionHref|group relative/,
  );
});

test("real estate audiences, AI employees, customer templates, and SEO are present", () => {
  const homepage = read("features/marketing/components/Homepage.tsx");
  const workforce = read(
    "features/marketing/components/EnterpriseExperience.tsx",
  );
  const metadata = read("app/layout.tsx");
  for (const audience of [
    "Agencies",
    "Brokerages",
    "Property Developers",
    "Commercial Real Estate",
    "Luxury Real Estate",
    "Property Investment Firms",
  ])
    assert.match(homepage, new RegExp(audience));
  for (const employee of [
    "AI Sales Assistant",
    "AI CRM Manager",
    "AI Marketing Strategist",
    "AI WhatsApp Assistant",
    "AI Voice Agent",
    "AI Property Advisor",
    "AI Operations Manager",
    "AI Executive Assistant",
  ])
    assert.match(workforce, new RegExp(employee));
  for (const story of [
    "Developer customer story",
    "Brokerage customer story",
    "Real estate agency customer story",
  ])
    assert.match(homepage, new RegExp(story, "i"));
  assert.match(metadata, /AI Operating System for Real Estate/i);
});
