import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");

test("hero defines the AI operating system category for real estate", () => {
  const source = read("features/marketing/components/Homepage.tsx");
  assert.match(
    source,
    /Powered by the World&apos;s Most Advanced AI Operating System for Real Estate/,
  );
  for (const item of [
    "AI Employees",
    "Hire Your Entire AI Real Estate Team in Under 5 Minutes",
    "Real Estate CRM",
    "WhatsApp Automation",
    "AI Voice Agents",
    "Marketing Automation",
    "Property Intelligence",
    "Deal & Revenue Tracking",
    "Secure Workspaces",
    "Start Free Trial",
    "Book Live Demo",
    "Watch 2-Minute Demo",
  ])
    assert.match(source, new RegExp(item));
});

test("product preview shows actual real estate operating modules", () => {
  const source = read("features/marketing/components/EnterpriseExperience.tsx");
  for (const item of [
    "Property Pipeline",
    "AI Employees",
    "Property Listings",
    "Lead Qualification",
    "Appointments",
    "Executive Dashboard",
  ])
    assert.match(source, new RegExp(item));
});

test("workforce roles explain real estate outcomes and daily work", () => {
  const source = read("features/marketing/components/EnterpriseExperience.tsx");
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
    assert.match(source, new RegExp(employee));
  for (const capability of [
    "Lead scoring",
    "Campaigns",
    "Data health",
    "Qualification",
    "Call prep",
    "Briefings",
    "Matching",
    "Bottlenecks",
  ])
    assert.match(source, new RegExp(capability));
});

test("story covers one feature grid audience workflow ROI and customer proof", () => {
  const source = read("features/marketing/components/Homepage.tsx");
  for (const item of [
    "Complete Real Estate Operating System",
    "Built Specifically For Real Estate",
    "Agencies",
    "Brokerages",
    "Property Investment Firms",
    "Product demo",
    "Lead enters",
    "Deal won",
    "Business case",
    "Customer proof",
    "Property Intelligence",
  ])
    assert.match(source, new RegExp(item));
  for (const removed of [
    "Stop Paying For 15 Different Tools",
    "Product ecosystem",
  ])
    assert.doesNotMatch(source, new RegExp(removed));
});

test("enterprise trust pricing FAQ navigation and SEO are preserved", () => {
  const homepage = read("features/marketing/components/Homepage.tsx"),
    pricing = read("features/marketing/components/PricingTable.tsx"),
    shell = read("features/marketing/components/MarketingShell.tsx"),
    layout = read("app/layout.tsx");
  for (const item of [
    "Secure by design",
    "Human approval controls",
    "Cloud-native infrastructure",
    "Encrypted Credentials",
  ])
    assert.match(homepage, new RegExp(item));
  for (const plan of ["Starter", "Growth", "Enterprise"])
    assert.match(pricing, new RegExp(plan));
  for (const nav of [
    "Platform",
    "AI Employees",
    "Solutions",
    "Pricing",
    "Resources",
    "Book Demo",
    "Start Free",
    "Developers",
  ])
    assert.match(shell, new RegExp(nav));
  assert.match(homepage, /FAQPage/);
  assert.match(homepage, /SoftwareApplication/);
  assert.match(layout, /real estate/i);
});

test("Sprint 72 introduces no backend or schema artifact", () => {
  assert.equal(
    existsSync("docs/SPRINT_72_POSITIONING_AND_CONVERSION.md"),
    true,
  );
  assert.equal(
    existsSync("supabase/migrations/20260904000000_sprint72.sql"),
    false,
  );
});
