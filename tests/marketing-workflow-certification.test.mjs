import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { auditMarketingWorkflows } from "../scripts/audit-marketing-workflows.mjs";
import { loadPureModule } from "../scripts/audit-product-unification.mjs";

const require = createRequire(import.meta.url);
const link = ({ children, ...props }) => React.createElement("a", props, children);
const common = {
  "server-only": {}, "next/link": link,
  "@/features/platform/design-system": { ButtonLink: link, Button: ({ children, ...props }) => React.createElement("button", props, children) },
  "@/features/vayon/creative-studio/actions": { createCreativeDraftAction: async () => {} },
};
function load(file, mocks = {}) {
  const filename = resolve(file), source = readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const compiledModule = { exports: {} }, registry = { ...common, ...mocks };
  const localRequire = name => {
    if (Object.hasOwn(registry, name)) return registry[name];
    if (name.startsWith("@/") || name.startsWith(".")) {
      const stem = name.startsWith("@/") ? resolve(name.slice(2)) : resolve(dirname(filename), name);
      const alias = "@/" + stem.slice(process.cwd().length + 1).replaceAll("\\", "/");
      if (Object.hasOwn(registry, alias)) return registry[alias];
      return load(existsSync(stem + ".ts") ? stem + ".ts" : stem + ".tsx", mocks);
    }
    return require(name);
  };
  new Function("require", "module", "exports", code)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const html = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test("marketing source inventory resolves every Growth CTA and mounts the existing saving wizard", () => {
  assert.deepEqual(auditMarketingWorkflows().issues, []);
  const { isCustomerRouteExposed } = loadPureModule("config/canonical-routes.ts");
  assert.equal(isCustomerRouteExposed("/vayon/creative/templates"), false);
  assert.equal(isCustomerRouteExposed("/vayon/creative-studio/templates"), false);
});
test("Growth renders canonical workflow links only when available", () => {
  const { GrowthOverview } = load("features/vayon/growth-intelligence/GrowthOverview.tsx");
  const available = html(GrowthOverview, { userName: "QA", marketingAvailable: true });
  assert.match(available, /href="\/vayon\/creative\/campaigns"/);
  assert.match(available, /href="\/vayon\/creative"/);
  const unavailable = html(GrowthOverview, { userName: "QA", marketingAvailable: false });
  assert.match(unavailable, /Continue when Campaigns become available/);
  assert.doesNotMatch(unavailable, /href="\/vayon\/creative/);
  const { GrowthSectionPage } = load("features/vayon/growth-intelligence/GrowthSectionPage.tsx");
  assert.doesNotMatch(html(GrowthSectionPage, { sectionSlug: "lead-generation", actionAvailable: false }), /<a |<button/);
  assert.match(html(GrowthSectionPage, { sectionSlug: "lead-generation", actionAvailable: true }), /href="\/vayon\/creative\/campaigns"/);
});
test("canonical Campaigns page reuses the real form and handles missing project/access prerequisites", async () => {
  let projects = [{ id: "project-qa", name: "QA Project", developer: "QA", city: "Test" }], enabled = true;
  const Page = load("app/vayon/creative/campaigns/page.tsx", {
    "@/features/vayon/creative-studio/service": { CreativeStudioService: { production: async () => enabled ? { projectContext: async () => ({ inventory: { projects } }) } : null } },
  }).default;
  const render = async () => renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ goal: "Find buyers" }) }));
  const markup = await render();
  assert.match(markup, /name="projectId"/);
  assert.match(markup, /Find buyers/);
  assert.match(markup, /Generate governed draft/);
  assert.doesNotMatch(markup, /Save campaign blueprint|Campaign Analytics|disabled=""/);
  projects = [];
  assert.match(await render(), /Campaign drafts need project inventory/);
  assert.doesNotMatch(await render(), /<form/);
  enabled = false;
  assert.doesNotMatch(await render(), /<form|<a /);
});
test("existing campaign action waits for persistence before success navigation and recovers failed saves", async () => {
  const events = [];
  let fail = false;
  const actions = load("features/vayon/creative-studio/actions.ts", {
    "@/features/vayon/operations/services/context": { operationsContext: async () => ({ organizationId: "qa-org", workspaceId: "qa-workspace", client: { auth: { getUser: async () => ({ data: { user: { id: "qa" } }, error: null }) }, from: () => { const q = { select: () => q, eq: () => q, is: () => q, maybeSingle: async () => ({ data: { status: "active" }, error: null }) }; return q; } } }) },
    "next/cache": { revalidatePath: path => events.push(["revalidate", path]) },
    "next/navigation": { redirect: path => { events.push(["redirect", path]); throw new Error("REDIRECT"); } },
    "./service": { CreativeStudioService: { production: async () => ({ saveDraft: async (brief, name) => { events.push(["save", brief.projectId, name]); if (fail) throw new Error("QA failure"); return "draft-qa"; } }) } },
    "./generation.service": {}, "./access.service": {}, "./growth.service": {},
  });
  const { campaignTypes } = loadPureModule("features/vayon/creative-studio/domain.ts");
  const form = new FormData();
  form.set("projectId", "project-qa"); form.set("name", "QA draft"); form.set("campaignType", campaignTypes[0]);
  await assert.rejects(actions.createCreativeDraftAction(form), /REDIRECT/);
  assert.deepEqual(events[0], ["save", "project-qa", "QA draft"]);
  assert.match(events.at(-1)[1], /success=Campaign/);
  events.length = 0; fail = true;
  await assert.rejects(actions.createCreativeDraftAction(form), /REDIRECT/);
  assert.match(events.at(-1)[1], /campaigns\?error=/);
  assert.equal(events.some(([kind]) => kind === "revalidate"), false);
});
test("browser fixture clicks rendered Growth CTAs into the existing campaign form and Creative route", async () => {
  const { GrowthOverview } = load("features/vayon/growth-intelligence/GrowthOverview.tsx");
  const { CampaignWizard } = load("features/vayon/creative-studio/components/StudioViews.tsx");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route("https://marketing-qa.invalid/**", async route => {
      const path = new URL(route.request().url()).pathname;
      const body = path === "/vayon/growth" ? html(GrowthOverview, { userName: "QA", marketingAvailable: true }) : path === "/vayon/creative/campaigns" ? html(CampaignWizard, { projects: [{ id: "qa", name: "QA", developer: "QA", city: "QA" }] }) : "<main><h1>Creative route fixture</h1></main>";
      await route.fulfill({ status: 200, contentType: "text/html", body });
    });
    await page.goto("https://marketing-qa.invalid/vayon/growth");
    await page.getByRole("link", { name: /Prepare a campaign/ }).click();
    await page.waitForURL("**/vayon/creative/campaigns");
    assert.equal(await page.getByRole("button", { name: "Generate governed draft" }).isEnabled(), true);
    assert.equal(await page.getByLabel("Property project").count(), 1);
    await page.goto("https://marketing-qa.invalid/vayon/growth");
    await page.getByRole("link", { name: /Create marketing materials/ }).click();
    await page.waitForURL("**/vayon/creative");
  } finally { await browser.close(); }
});
