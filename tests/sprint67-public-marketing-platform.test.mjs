import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (p) => readFileSync(p, "utf8");
test("public marketing preserves repository service provider architecture", () => {
  for (const p of [
    "contracts/index.ts",
    "repositories/marketing.repository.ts",
    "services/marketing.service.ts",
    "providers/supabase-marketing.provider.ts",
  ])
    assert.ok(existsSync(`features/marketing/${p}`));
});
test("every requested public page exists", () => {
  for (const p of [
    "features",
    "solutions",
    "industries",
    "pricing",
    "ai-workforce",
    "customers",
    "blog",
    "about",
    "careers",
    "contact",
    "privacy",
    "terms",
    "security",
    "trust-center",
  ])
    assert.ok(existsSync(`app/(marketing)/${p}/page.tsx`));
  assert.ok(existsSync("app/demo/page.tsx"));
  assert.match(read("app/page.tsx"), /Homepage/);
});
test("homepage covers focused positioning and interactive conversion", () => {
  const s = read("features/marketing/components/Homepage.tsx");
  for (const x of [
    "Product demo",
    "WorkflowMotion",
    "Complete Real Estate Operating System",
    "AiTeamGrid",
    "Built Specifically For Real Estate",
    "LandingRoiCalculator",
    "PricingTable",
    "Start Free",
    "Book Demo",
  ])
    assert.match(s, new RegExp(x, "i"));
  assert.match(s, /SoftwareApplication/);
});
test("pricing uses localized commercial destinations", () => {
  const s = read("features/marketing/components/PricingTable.tsx");
  for (const x of [
    "Starter",
    "price: 79",
    "Professional",
    "price: 149",
    "Business Plus",
    "Enterprise",
    "Commercial packages",
    "Commercial questions, answered",
    "Contact Sales",
    "CurrencyDisplay",
  ])
    assert.match(s, new RegExp(x));
  assert.ok(s.includes("/signup?plan="));
});
test("SEO includes canonicals open graph structured data sitemap and robots", () => {
  const layout = read("app/layout.tsx"),
    map = read("app/sitemap.ts"),
    robots = read("app/robots.ts"),
    content = read("features/marketing/components/PublicContentPage.tsx");
  assert.match(layout, /alternates/);
  assert.match(layout, /openGraph/);
  assert.match(content, /application\/ld\+json/);
  for (const route of [
    "features",
    "solutions",
    "privacy",
    "terms",
    "trust-center",
  ])
    assert.match(map, new RegExp(route));
  assert.doesNotMatch(map, /"\/industries"/);
  assert.match(robots, /disallow/);
});
test("blog supports categories authors tags related articles and search", () => {
  const repo = read("features/marketing/repositories/marketing.repository.ts"),
    page = read("features/marketing/components/Blog.tsx");
  for (const x of [
    "category",
    "author",
    "tags",
    "related",
    "query",
    "Search articles",
    "Related articles",
  ])
    assert.match(repo + page, new RegExp(x, "i"));
  assert.ok(existsSync("app/(marketing)/blog/[slug]/page.tsx"));
});
test("lead capture and observability validate input and expose no public table writes", () => {
  const action = read("features/marketing/actions/lead.actions.ts"),
    provider = read(
      "features/marketing/providers/supabase-marketing.provider.ts",
    ),
    sql = read(
      "supabase/migrations/20260831000000_sprint67_public_marketing_platform.sql",
    );
  for (const x of ["demo", "trial", "sales", "newsletter", "email"])
    assert.match(action, new RegExp(x));
  assert.ok(action.includes("max(2000)"));
  assert.match(provider, /\.rpc\(/);
  assert.doesNotMatch(provider, /\.from\([^)]*\)\.insert/);
  assert.match(sql, /enable row level security/g);
  assert.match(sql, /session_hash/);
  assert.match(sql, /revoke all/);
});
