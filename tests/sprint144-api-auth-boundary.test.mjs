import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proxySource = readFileSync("proxy.ts", "utf8");
const matcherSource = proxySource.match(/matcher:\s*(\[[\s\S]*?\])/u)?.[1];

assert.ok(matcherSource, "proxy matcher configuration is missing");

const config = { matcher: JSON.parse(matcherSource.replace(/,\s*\]$/u, "]")) };
const proxyMatcher = new RegExp(`^${config.matcher[0]}$`, "u");
const doesProxyMatch = (url) => proxyMatcher.test(url);

const apiRoutes = [
  "/api",
  "/api/billing/paddle/checkout",
  "/api/billing/paddle/portal",
  "/api/webhooks/paddle",
  "/api/auth/callback",
  "/api/analytics/events",
  "/api/ai/chat",
];

test("all API routes bypass the authentication and onboarding proxy", () => {
  for (const url of apiRoutes) {
    assert.equal(
      doesProxyMatch(url),
      false,
      `${url} must reach its route handler without proxy interception`,
    );
  }

  assert.match(proxySource, /path === "\/api"/u);
  assert.match(proxySource, /path\.startsWith\(API_PATH_PREFIX\)/u);
  assert.match(proxySource, /return NextResponse\.next\(\)/u);
});

test("public website pages continue through the public-route boundary", () => {
  for (const url of [
    "/",
    "/pricing",
    "/features",
    "/docs",
    "/blog",
    "/resources",
    "/about",
    "/privacy",
    "/customers",
    "/industries/real-estate",
    "/solutions/startups",
  ]) {
    assert.equal(doesProxyMatch(url), true);
  }
});

test("protected application pages remain inside the authentication boundary", () => {
  for (const url of [
    "/vayon/dashboard",
    "/founder/overview",
    "/crm/contacts",
    "/creative/studio",
    "/settings/profile",
    "/billing/subscription",
    "/admin/users",
  ]) {
    assert.equal(doesProxyMatch(url), true);
  }
});

test("Paddle endpoints remain implemented by their route handlers", () => {
  const checkout = readFileSync(
    "app/api/billing/paddle/checkout/route.ts",
    "utf8",
  );
  const portal = readFileSync(
    "app/api/billing/paddle/portal/route.ts",
    "utf8",
  );
  const webhook = readFileSync("app/api/webhooks/paddle/route.ts", "utf8");

  assert.match(checkout, /export async function POST/u);
  assert.match(portal, /export async function POST/u);
  assert.match(webhook, /export async function POST/u);
});
