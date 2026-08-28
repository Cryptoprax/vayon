import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("public navigation is focused and Solutions is a direct route", () => {
  const shell = read("features/marketing/components/MarketingShell.tsx");
  for (const label of [
    "Platform",
    "Solutions",
    "AI Employees",
    "Pricing",
    "Resources",
    "Book Demo",
    "Start Free",
  ])
    assert.match(shell, new RegExp(label));
  assert.match(shell, /label: "Solutions", href: "\/solutions"/);
  assert.doesNotMatch(
    shell,
    /label: "Industries"|realEstateSolutions|solutionHref|group relative/,
  );
});

test("solutions hub contains nine real estate conversion paths", () => {
  const catalog = read("features/marketing/content/commercial-catalog.ts");
  for (const solution of [
    "AI Sales Employees",
    "Real Estate CRM",
    "Property Management",
    "Lead Generation",
    "WhatsApp Automation",
    "Marketing Automation",
    "Creative Studio",
    "Executive Dashboard",
    "Growth Intelligence",
  ])
    assert.match(catalog, new RegExp(solution));
  assert.equal(catalog.match(/screenshots:/g)?.length, 9);
  assert.equal(catalog.match(/solution:/g)?.length, 9);
});

test("solution pages explain value and every public page receives the final CTA", () => {
  const catalogPage = read(
    "features/marketing/components/CommercialCatalogPage.tsx",
  );
  const shell = read("features/marketing/components/MarketingShell.tsx");
  for (const section of [
    "The problem",
    "How VAYON solves it",
    "Key benefits",
    "Product screenshots",
  ])
    assert.match(catalogPage, new RegExp(section));
  for (const cta of [
    "Start Free Trial",
    "Book Live Demo",
    "Watch 2-Minute Demo",
  ])
    assert.match(shell, new RegExp(cta));
  assert.match(
    shell,
    /\{children\}<\/div>\s*<ConversionCta \/>\s*<MarketingFooter \/>/,
  );
});
