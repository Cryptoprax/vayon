import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { loadPureModule } from "../scripts/audit-product-unification.mjs";
import { auditCustomerRoutes } from "../scripts/audit-customer-routes.mjs";
import { assertReady } from "../scripts/certify-customer-navigation.mjs";

test("customer catalogs resolve to pages and redirect targets are canonical", () => {
  assert.deepEqual(auditCustomerRoutes().issues, []);
  const { canonicalCustomerHref } = loadPureModule("config/canonical-routes.ts");
  assert.equal(canonicalCustomerHref("/vayon/creative-studio/packs?property=123#review"), "/vayon/creative/campaigns?property=123#review");
  assert.equal(canonicalCustomerHref("/vayon/creative-studio/editor/123"), "/vayon/creative-studio/editor/123");
});
test("search hides unfinished child destinations even under a permitted parent", () => {
  const { StaticNavigationSearchProvider } = loadPureModule("features/vayon/universal-bar/providers/static-navigation.provider.ts");
  const provider = new StaticNavigationSearchProvider([
    { id: "creative", label: "Creative", href: "/vayon/creative", visible: true },
    { id: "cloud", label: "Cloud", href: "/vayon/creative/cloud", visible: true },
    { id: "assets", label: "Assets", href: "/vayon/creative-studio/assets", visible: true },
  ]);
  assert.equal(provider.search({ query: "Cloud", scopes: provider.scopes }).length, 0);
  assert.equal(provider.search({ query: "Assets", scopes: provider.scopes })[0].href, "/vayon/creative/assets");
});
test("browser readiness rejects error boundaries, unfinished pages, and persistent loading", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent("<main><h1>Properties</h1><p>No properties yet. Add a property.</p></main>");
    await assertReady(page, { authenticated: false, timeout: 1000 });
    for (const text of ["This workspace view could not load", "This page could not be found", "Coming Soon"]) {
      await page.setContent(`<main><h1>${text}</h1></main>`);
      await assert.rejects(assertReady(page, { authenticated: false, timeout: 1000 }));
    }
    for (const markup of ['<main aria-busy="true">Loading</main>', '<main><div class="animate-pulse">Loading</div></main>', '<main></main>']) {
      await page.setContent(markup);
      await assert.rejects(assertReady(page, { authenticated: false, timeout: 300 }));
    }
  } finally { await browser.close(); }
});
