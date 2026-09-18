import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { load } from "./helpers/sprint237-load.mjs";

const publicUrl = readFileSync("lib/public-url.ts", "utf8");
const robotsSource = readFileSync("app/robots.ts", "utf8");
const marketingPage = readFileSync("features/marketing/components/MarketingPage.tsx", "utf8");
const publicContentPage = readFileSync("features/marketing/components/PublicContentPage.tsx", "utf8");
const pricingContent = readFileSync("features/marketing/content/pages.ts", "utf8");
const { resolvePlanAction } = load("features/vayon/billing/services/plan-action.ts");

test("1-2: robots.ts derives host and sitemap reference from the canonical www domain", () => {
  assert.match(publicUrl, /https:\/\/www\.vayon\.online/);
  assert.match(robotsSource, /sitemap: `\$\{publicSiteUrl\}\/sitemap\.xml`/);
  assert.match(robotsSource, /host: publicSiteUrl/);
  assert.doesNotMatch(robotsSource, /https:\/\/vayon\.online/);
});

test("2b: robots() output uses the canonical www domain when NEXT_PUBLIC_APP_URL is unset", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  try {
    const { default: robots } = load("app/robots.ts");
    const result = robots();
    assert.equal(result.host, "https://www.vayon.online");
    assert.equal(result.sitemap, "https://www.vayon.online/sitemap.xml");
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});

test("3-4: sitemap URLs use the canonical www domain and contain no duplicates", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  try {
    const { default: sitemap } = load("app/sitemap.ts");
    const entries = sitemap();
    assert.ok(entries.length > 0, "expected sitemap to produce entries");
    for (const entry of entries) assert.match(entry.url, /^https:\/\/www\.vayon\.online/);
    const urls = entries.map((entry) => entry.url);
    assert.equal(new Set(urls).size, urls.length, "sitemap must not contain duplicate <loc> URLs");
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});

test("5: sitemap does not expose authenticated /vayon application routes", () => {
  const { default: sitemap } = load("app/sitemap.ts");
  for (const entry of sitemap()) assert.doesNotMatch(new URL(entry.url).pathname, /^\/vayon(\/|$)/);
});

test("6: sitemap does not expose backend /api/* endpoints (the public /api marketing page is not a backend route)", () => {
  const { default: sitemap } = load("app/sitemap.ts");
  for (const entry of sitemap()) assert.doesNotMatch(new URL(entry.url).pathname, /^\/api\//);
});

test('7: no production JSON-LD references the stale "vayon.app" domain', () => {
  for (const source of [marketingPage, publicContentPage]) {
    assert.doesNotMatch(source, /vayon\.app/);
    assert.match(source, /publicSiteUrl/);
  }
});

test("8: public canonical metadata (JSON-LD identity URLs) resolves to www.vayon.online by default", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  try {
    assert.equal(load("lib/public-url.ts").publicSiteUrl, "https://www.vayon.online");
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});

test("9: pricing page copy no longer references Stripe or pre-launch/internal wording", () => {
  assert.doesNotMatch(pricingContent, /Stripe/);
  assert.doesNotMatch(pricingContent, /available at launch/i);
});

test("10: pricing package values are unchanged", () => {
  const pricing = readFileSync("features/platform/commercial-pricing.ts", "utf8");
  assert.match(pricing, /code: "starter".*standardMonthlyPrice: 79/);
  assert.match(pricing, /code: "professional".*standardMonthlyPrice: 149/);
  assert.match(pricing, /code: "business".*standardMonthlyPrice: 399/);
  assert.match(pricing, /code: "business_plus".*standardMonthlyPrice: 799/);
  assert.match(pricing, /code: "enterprise".*standardMonthlyPrice: null/);
});

test("11: Business Plus remains self-service (checkout/upgrade available, never Contact Sales)", () => {
  assert.equal(resolvePlanAction({ planCode: "business_plus", currentPlanCode: null, hasActiveSubscription: false, checkoutEnabled: true, hasClientToken: true }), "checkout");
  assert.equal(resolvePlanAction({ planCode: "business_plus", currentPlanCode: "business", hasActiveSubscription: true, checkoutEnabled: true, hasClientToken: true }), "upgrade");
});

test("12: Enterprise remains Contact Sales", () => {
  assert.equal(resolvePlanAction({ planCode: "enterprise", currentPlanCode: null, hasActiveSubscription: false, checkoutEnabled: true, hasClientToken: true }), "contact");
});
