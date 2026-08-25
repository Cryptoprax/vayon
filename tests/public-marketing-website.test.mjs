import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
const routes = [
  "product",
  "ai-workforce",
  "crm",
  "properties",
  "deals",
  "communications",
  "calendar",
  "workflows",
  "integrations",
  "security",
  "enterprise",
  "pricing",
  "customers",
  "resources",
  "blog",
  "docs",
  "about",
  "careers",
  "contact",
];
test("every additive marketing route exists in the isolated route group", () => {
  for (const route of routes)
    assert.ok(existsSync(`app/(marketing)/${route}/page.tsx`), route);
});
test("existing route collisions remain untouched and documented", () => {
  for (const path of [
    "app/page.tsx",
    "app/platform/page.tsx",
    "app/demo/page.tsx",
  ])
    assert.ok(existsSync(path));
  assert.match(
    read("docs/PUBLIC_MARKETING_WEBSITE.md"),
    /existing `\/`, `\/platform`, and `\/demo` routes were preserved/i,
  );
});
test("marketing routes are public without exposing authenticated application paths", () => {
  const source = read("lib/supabase/proxy.ts");
  for (const route of routes.filter((route) => route !== "crm"))
    assert.match(source, new RegExp(`"/${route}"`));
  const publicInventory = source.match(
    /const PUBLIC_ROUTES = \[([\s\S]*?)\] as const;/,
  )?.[1];
  assert.ok(publicInventory);
  assert.doesNotMatch(publicInventory, /"\/(?:vayon|crm)"/);
});
test("shared server-first architecture avoids duplicated page implementations", () => {
  const layout = read("app/(marketing)/layout.tsx"),
    page = read("features/marketing/components/MarketingPage.tsx"),
    pricing = read("features/marketing/components/PricingTable.tsx");
  assert.match(layout, /MarketingShell/);
  assert.doesNotMatch(page, /"use client"/);
  assert.match(pricing, /"use client"/);
});
test("SEO includes canonical OpenGraph Twitter JSON-LD robots and sitemap", () => {
  const metadata = read("features/marketing/content/pages.ts"),
    page = read("features/marketing/components/MarketingPage.tsx");
  for (const value of ["canonical", "openGraph", "twitter"])
    assert.match(metadata, new RegExp(value));
  assert.match(page, /application\/ld\+json/);
  assert.ok(existsSync("app/robots.ts"));
  assert.ok(existsSync("app/sitemap.ts"));
});
test("marketing claims and empty states do not fabricate launch evidence", () => {
  const files = [
    "features/marketing/content/pages.ts",
    "features/marketing/components/MarketingPage.tsx",
    "features/marketing/components/PricingTable.tsx",
  ]
    .map(read)
    .join("\n");
  for (const boundary of [
    "no certification is implied",
    "No customer\\s+endorsement",
    "Pricing available at launch",
    "No open roles published",
    "Contact channels coming soon",
  ])
    assert.match(files, new RegExp(boundary, "i"));
});
test("navigation and content surfaces expose accessibility semantics", () => {
  const shell = read("features/marketing/components/MarketingShell.tsx"),
    page =
      read("features/marketing/components/MarketingPage.tsx") +
      read("features/marketing/components/PricingTable.tsx");
  for (const value of [
    "Skip to content",
    "aria-label",
    "<header",
    "<nav",
    "<footer",
  ])
    assert.match(shell, new RegExp(value));
  for (const value of ["aria-labelledby", "<main", "<caption", "scope="])
    assert.match(page, new RegExp(value));
});
test("marketing layer has no backend database or provider calls", () => {
  const files = [
    "features/marketing/content/pages.ts",
    "features/marketing/components/MarketingShell.tsx",
    "features/marketing/components/MarketingPage.tsx",
    "features/marketing/components/PricingTable.tsx",
  ]
    .map(read)
    .join("\n");
  assert.doesNotMatch(
    files,
    /supabase|fetch\(|axios|database|server action|use server|openai|stripe\./i,
  );
});
test("documentation records SEO performance accessibility CMS and Sprint 39", () => {
  const source = read("docs/PUBLIC_MARKETING_WEBSITE.md");
  for (const value of [
    "SEO",
    "Performance",
    "Accessibility",
    "Future CMS strategy",
    "Sprint 39 recommendation",
  ])
    assert.match(source, new RegExp(value, "i"));
});
