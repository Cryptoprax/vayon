import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

test("canonical compatibility registry consolidates true duplicate routes", () => {
  const routes = read("config/canonical-routes.ts");
  for (const pair of [["/vayon/workforce", "/vayon/ai/workforce"], ["/vayon/crm/leads", "/vayon/leads"], ["/vayon/notifications/inbox", "/vayon/notifications"], ["/vayon/creative-studio", "/vayon/creative"]]) for (const route of pair) assert.ok(routes.includes(route));
  assert.match(read("next.config.ts"), /canonicalRouteRedirects/);
});

test("primary navigation uses canonical workforce and hides runtime architecture", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  assert.match(navigation, /label: "Workforce", href: "\/vayon\/ai\/workforce"/);
  for (const hidden of ["/vayon/runtime", "/vayon/cognitive", "/vayon/brain", "/vayon/executions"]) assert.doesNotMatch(navigation, new RegExp(hidden.replaceAll("/", "\\/")));
});

test("Playwright certification declares browser and responsive projects", () => {
  const config = read("playwright.config.ts");
  for (const browser of ["chromium-desktop", "edge-desktop", "firefox-desktop", "webkit-desktop", "tablet", "mobile"]) assert.ok(config.includes(browser));
  assert.match(read("tests/e2e/launch-certification.spec.ts"), /PLAYWRIGHT_AUTH_STATE/);
});

test("lifecycle documentation distinguishes blocked beta internal and launch modules", () => {
  const lifecycle = read("docs/MODULE_OWNERSHIP_AND_LIFECYCLE.md");
  for (const state of ["Launch candidate", "Beta", "Blocked", "Internal"]) assert.ok(lifecycle.includes(state));
});
