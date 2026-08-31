import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const page = read("app/vayon/home/page.tsx");
const proxy = read("proxy.ts");
const oauth = read("features/authentication/security/oauth.ts");
const audit = read("scripts/audit-route-integrity.mjs");

test("direct and bookmarked legacy home visits use a redirect-only page", () => {
  assert.match(page, /destination = suffix \? `\/vayon\/dashboard\$\{suffix\}` : "\/vayon\/dashboard"/);
  assert.match(page, /redirect\(destination\)/);
  assert.doesNotMatch(page, /FounderCommandCenter|return\s*</);
});

test("legacy home query strings preserve single and repeated values", () => {
  assert.match(page, /new URLSearchParams\(\)/);
  assert.match(page, /query\.append\(key, item\)/);
  assert.match(page, /query\.set\(key, value\)/);
});

test("middleware normalizes legacy home before session and visibility checks", () => {
  const normalization = proxy.indexOf('path === "/vayon/home"');
  assert.ok(normalization >= 0);
  assert.ok(normalization < proxy.indexOf("refreshSession(request)"));
  assert.match(proxy, /destination\.pathname = "\/vayon\/dashboard"/);
  assert.match(proxy, /NextResponse\.redirect\(destination, 307\)/);
});

test("middleware clone preserves query strings for authenticated and anonymous requests", () => {
  assert.match(proxy, /request\.nextUrl\.clone\(\)/);
  assert.doesNotMatch(proxy, /destination\.search\s*=/);
});

test("OAuth callbacks normalize legacy home and preserve its query and hash", () => {
  assert.match(oauth, /legacyAuthenticatedPaths/);
  assert.match(oauth, /\["\/vayon\/home", "\/vayon\/dashboard"\]/);
  assert.match(oauth, /`\$\{pathname\}\$\{parsed\.search\}\$\{parsed\.hash\}`/);
});

test("the canonical authenticated fallback is the dashboard", () => {
  assert.match(oauth, /defaultAuthenticatedPath = "\/vayon\/dashboard"/);
});

test("legacy home can never render a page or produce a route-level 404", () => {
  assert.match(page, /from "next\/navigation"/);
  assert.match(page, /redirect\(/);
  assert.doesNotMatch(page, /notFound\(/);
});

test("route audit rejects all non-compatibility legacy destinations", () => {
  assert.match(audit, /legacyHomeAllowlist/);
  assert.match(audit, /forbiddenLegacyReferences/);
  assert.match(audit, /app\/vayon\/home\/page\.tsx/);
  assert.match(audit, /features\/authentication\/security\/oauth\.ts/);
});
