import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proxy = readFileSync("lib/supabase/proxy.ts", "utf8");

const publicRoutes = [
  "/",
  "/features",
  "/pricing",
  "/solutions/startups",
  "/industries/real-estate",
  "/about",
  "/contact",
  "/security",
  "/trust-center",
  "/status",
  "/docs",
  "/help",
  "/blog",
  "/customers",
  "/developers",
  "/docs/architecture-overview",
  "/docs/release-notes",
  "/docs/api-reference",
  "/demo",
  "/roi-calculator",
  "/media-kit",
  "/partners",
  "/investors",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/cookie-policy",
  "/support-policy",
  "/acceptable-use-policy",
  "/ai-usage-policy",
  "/data-processing-addendum",
];

test("every Sprint 142 website and legal destination is publicly classified", () => {
  for (const route of publicRoutes) {
    const root = `"/${route.split("/").filter(Boolean)[0] ?? ""}"`;
    assert.ok(proxy.includes(root), `${route} is absent from the public boundary`);
  }
  assert.match(proxy, /if \(isPublic\) return response/);
});

test("application route roots are absent from the public boundary", () => {
  const inventory = proxy.match(
    /const PUBLIC_ROUTES = \[([\s\S]*?)\] as const;/,
  )?.[1];
  assert.ok(inventory);
  for (const route of [
    "/vayon",
    "/founder",
    "/crm",
    "/creative",
    "/billing",
    "/settings",
    "/admin",
  ]) {
    assert.doesNotMatch(inventory, new RegExp(`"${route}"`));
  }
  assert.match(proxy, /if \(!user && !isPublic\)/);
  assert.match(proxy, /target\.pathname = "\/login"/);
});

test("nested public content is intentional and application prefixes are not", () => {
  for (const route of [
    "/features",
    "/solutions",
    "/industries",
    "/customers",
    "/blog",
    "/docs",
  ]) {
    assert.match(proxy, new RegExp(`"${route}"`));
  }
  assert.doesNotMatch(proxy, /PUBLIC_ROUTE_PREFIXES[\s\S]*?"\/platform"/);
  assert.doesNotMatch(proxy, /^\s*"\/platform",\s*$/m);
});
