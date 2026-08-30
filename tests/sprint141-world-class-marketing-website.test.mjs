import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(p, "utf8"),
  exists = (p) => fs.existsSync(p);
test("public navigation and footer expose the commercial information architecture", () => {
  const s = read("features/marketing/components/MarketingShell.tsx");
  for (const x of [
    "Platform",
    "Solutions",
    "AI Employees",
    "Pricing",
    "Resources",
    "Sign In",
    "Start Free",
    "Book Demo",
    "Trust",
    "Legal",
    "Status",
    "Global Search",
  ])
    assert.ok(s.includes(x), x);
  assert.ok(exists("app/(marketing)/search/page.tsx"));
});
test("solution industry and flagship product catalogs are complete", () => {
  const s = read("features/marketing/content/commercial-catalog.ts");
  for (const x of [
    "AI Sales Employees",
    "Real Estate CRM",
    "Property Management",
    "Lead Generation",
    "WhatsApp Automation",
    "Marketing Automation",
    "Creative Studio",
    "Executive Dashboard",
    "Growth Intelligence",
    "AI Business Launch",
    "AI Workforce",
    "CRM",
    "Brand Studio",
    "Creative Studio",
    "Document Studio",
    "Image Studio",
    "Video Studio",
    "Campaign Studio",
    "Marketing Studio",
    "Sales Workspace",
    "Customer Success",
    "Founder Dashboard",
    "Business Intelligence",
  ])
    assert.ok(s.includes(x), x);
  for (const p of [
    "app/(marketing)/solutions/[slug]/page.tsx",
    "app/(marketing)/industries/[slug]/page.tsx",
    "app/(marketing)/features/[slug]/page.tsx",
  ])
    assert.ok(exists(p), p);
});
test("legal center provides every policy with version effective date and contents", () => {
  const component = read("features/marketing/components/LegalPolicyPage.tsx"),
    content = read("features/marketing/content/legal-content.ts");
  for (const x of ["Version", "Effective", "Table of contents"])
    assert.ok(component.includes(x), x);
  for (const x of [
    "Terms of Service",
    "Privacy Policy",
    "Acceptable Use Policy",
    "AI Usage Policy",
    "Data Processing Addendum",
    "Subprocessor List",
    "Copyright Policy",
    "Trademark Policy",
  ])
    assert.ok(content.includes(x), x);
  for (const route of [
    "terms",
    "privacy",
    "refund-policy",
    "cookie-policy",
    "acceptable-use-policy",
    "ai-usage-policy",
    "data-processing-addendum",
    "subprocessors",
    "copyright-policy",
    "trademark-policy",
  ])
    assert.ok(exists(`app/(marketing)/${route}/page.tsx`), route);
});
test("trust contact resources status and changelog are launch ready without fabricated evidence", () => {
  const contact = read("features/marketing/components/LeadCapture.tsx"),
    status = read("app/(marketing)/status/page.tsx"),
    home = read("features/marketing/components/Homepage.tsx");
  for (const email of [
    "hello@vayon.online",
    "sales@vayon.online",
    "billing@vayon.online",
    "legal@vayon.online",
    "privacy@vayon.online",
    "security@vayon.online",
  ])
    assert.ok(contact.includes(email), email);
  for (const service of [
    "Platform",
    "Authentication",
    "AI Runtime",
    "Creative Runtime",
    "Storage",
    "Billing",
    "API",
  ])
    assert.ok(status.includes(service), service);
  assert.match(status, /unknown/);
  assert.match(home, /Founding Customer Offer/);
  assert.match(home, /hasCustomerTestimonials = false/);
  assert.ok(
    read("app/(marketing)/release-notes/page.tsx").includes("v1.0.0 RC1"),
  );
});
test("SEO sitemap includes new static and catalog routes", () => {
  const s = read("app/sitemap.ts");
  for (const x of [
    "solutionCatalog",
    "industryCatalog",
    "productCatalog",
    "/acceptable-use-policy",
    "/data-processing-addendum",
    "/status",
    "/release-notes",
    "/help",
  ])
    assert.ok(s.includes(x), x);
});
