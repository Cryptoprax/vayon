// Isolated browser audit of the real component. Only Next navigation is stubbed;
// no application route, credentials, provider, or backend is used.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const root = process.cwd(), output = path.join(root, "build/sprint225-audit");
await mkdir(output, { recursive: true });
await writeFile(path.join(output, "loader.cjs"), `const ts = require(${JSON.stringify(require.resolve("typescript"))}); module.exports = function(source) { return ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText; };`);
await writeFile(path.join(output, "css-loader.cjs"), 'module.exports = function(source) { return `export default ${JSON.stringify(Object.fromEntries([...source.matchAll(/\\.([a-zA-Z][\\w-]*)/g)].map(x => [x[1],x[1]])))}`; };');
await writeFile(path.join(output, "navigation.js"), 'export const useRouter = () => ({push: value => { window.__navigation = value; }});');
await writeFile(path.join(output, "link.jsx"), 'import React from "react"; export default function Link(props) { return <a {...props}/>; }');
const ids = ["brand", "marketing", "presentations", "images", "videos", "websites", "documents", "assets", "templates", "projects"];
const names = ["Brand Studio", "Marketing Studio", "Presentation Studio", "Image Studio", "Video Studio", "Website Studio", "Document Studio", "Asset Library", "Template Marketplace", "Creative Projects"];
const fixture = {
  modules: ids.map((id, i) => ({ id, name: names[i], outcome: "Create consistent marketing assets with your existing workspace tools.", availability: "available" })),
  projects: [{ id: "campaign-1", name: "September launch campaign", status: "management-approval", updatedAt: "2026-09-01T12:00:00Z", assetCount: 1, categories: ["image"] }],
  assets: [{ id: "asset-1", campaignId: "campaign-1", projectId: "project-1", name: "September launch image", category: "image", format: "PNG", platform: "Instagram", language: "English", status: "management-approval", version: 2, prompt: "Launch image", aiEmployee: "Designer", creator: "QA", exports: ["PNG", "PDF"], edits: [], publishingHistory: [], generatedAt: "2026-09-01T12:00:00Z" }],
  brandKits: [{ id: "brand-1", name: "Workspace brand", logoPath: "private/logo.png", colors: ["#183A32", "#F5F0E5"], fonts: ["Inter"], typography: ["Sans serif"], tone: "Clear and welcoming" }],
  templates: ["Luxury", "Premium Apartment", "Villa"].map((category, i) => ({ id: `template-${i}`, category, name: `${category} campaign system`, editable: true })),
  projectCapabilities: ["autosave", "versions", "duplicate", "archive", "restore", "share", "export"], exportFormats: ["PNG", "JPG", "SVG", "PDF", "PPTX", "DOCX", "HTML", "MP4"], governance: { generationEnabled: false, providerReason: "Test provider unavailable" },
};
await writeFile(path.join(output, "entry.jsx"), `import React from "react";
import {createRoot} from "react-dom/client";
import {CreativeStudioHome} from "@/features/vayon/creative-studio-2/CreativeStudioHome";
import {FloatingLayoutManager} from "@/features/vayon/floating-layout/FloatingLayoutManager";
import {VayonIntelligence} from "@/features/vayon/intelligence-core/components/VayonIntelligence";
const snapshot = ${JSON.stringify(fixture)};
if (location.search.includes("empty")) { snapshot.projects=[]; snapshot.assets=[]; snapshot.templates=[]; snapshot.brandKits=[]; }
createRoot(document.getElementById("root")).render(<FloatingLayoutManager sidebarCollapsed={false}><div className="vayon-app-shell"><div className="vayon-shell-content"><div className="vayon-content-container"><CreativeStudioHome snapshot={snapshot}/></div></div></div><VayonIntelligence docked route="/vayon/creative" organization="QA" workspace="QA" user="QA" role="workspace-member" /></FloatingLayoutManager>);`);
await new Promise((resolve, reject) => webpack({ mode: "development", entry: path.join(output, "entry.jsx"), output: { path: output, filename: "bundle.js" }, devtool: false, resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"], alias: { "@": root, "next/navigation$": path.join(output, "navigation.js"), "next/link$": path.join(output, "link.jsx"), "@/features/platform/design-system$": path.join(root, "features/platform/design-system/components/core/Actions.tsx") } }, module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.join(output, "loader.cjs") }, { test: /\.css$/, use: path.join(output, "css-loader.cjs") }] } }, (error, stats) => error || stats.hasErrors() ? reject(error ?? new Error(stats.toString({ all: false, errors: true }))) : resolve()));
const globals = await readFile("app/globals.css", "utf8");
const css = await postcss([tailwind()]).process(globals, { from: path.join(root, "app/globals.css") });
await writeFile(path.join(output, "style.css"), css.css + await readFile("features/vayon/creative-studio-2/CreativeStudioHome.module.css", "utf8"));
const server = createServer(async (request, response) => {
  const file = request.url === "/bundle.js" ? "bundle.js" : request.url === "/style.css" ? "style.css" : null;
  response.setHeader("Content-Type", file === "bundle.js" ? "text/javascript" : file ? "text/css" : "text/html");
  response.end(file ? await readFile(path.join(output, file)) : '<!doctype html><html lang="en" data-vds-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body class="bg-vds-background text-vds-foreground"><div id="root"></div><script src="/bundle.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const url = `http://127.0.0.1:${server.address().port}`;
try {
  await page.goto(url);
  await page.getByRole("heading", { name: "AI Creative Center", exact: true }).waitFor();
  for (const width of [320, 375, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.reload();
    await page.getByRole("heading", { name: "AI Creative Center", exact: true }).waitFor();
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, columns: getComputedStyle(document.querySelector(".studioGrid")).gridTemplateColumns.split(" ").length, cardWidth: document.querySelector(".studioCard").getBoundingClientRect().width }));
    assert.equal(layout.overflow, false, `Page overflow at ${width}`);
    assert.ok(layout.cardWidth >= 210, `Narrow studio at ${width}: ${layout.cardWidth}`);
    assert.equal(layout.columns, width >= 1440 ? 4 : width >= 768 ? 2 : 1, `Columns at ${width}`);
    await page.getByRole("button", { name: "Assistant", exact: true }).click();
    await page.getByRole("button", { name: "Open Real Estate Assistant" }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Open dock overflow at ${width}`);
    const overlaps = await page.evaluate(() => { const a = document.querySelector(".content").getBoundingClientRect(), b = document.querySelector(".dock").getBoundingClientRect(); return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; });
    assert.equal(overlaps, false, `Dock overlaps content at ${width}`);
    await page.getByRole("button", { name: "Minimize VAYON Copilot" }).click();
    await page.getByRole("button", { name: "Collapse assistant" }).click();
    assert.equal(await page.locator('[data-floating-surface="action"]').count(), 1);
    await page.screenshot({ path: path.join(output, `creative-${width}.png`), fullPage: true });
  }
  await page.getByRole("button", { name: "Brand", exact: true }).click();
  assert.equal(await page.locator(".studioCard").count(), 1);
  await page.getByRole("button", { name: "All studios", exact: true }).click();
  assert.equal(await page.locator(".studioCard").count(), 10);
  await page.getByRole("button", { name: "Exports", exact: true }).click();
  await page.getByText("PNG \u00b7 PDF", { exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Search recent projects" }).fill("no match");
  await page.getByText("No matching work. Try a different search.").waitFor();
  await page.getByRole("button", { name: "Create with AI", exact: true }).first().click();
  assert.equal(await page.locator("dialog").evaluate(element => element.matches(":modal")), true);
  await page.getByRole("textbox", { name: "Creative brief" }).fill("Create a luxury real estate brochure.");
  await page.getByRole("button", { name: "Prepare execution plan" }).click();
  await page.getByText("Waiting Provider", { exact: true }).first().waitFor();
  for (let i = 0; i < 25; i++) { await page.keyboard.press("Tab"); assert.equal(await page.evaluate(() => !!document.activeElement.closest("dialog")), true, "Modal focus escaped"); }
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog").isVisible(), false);
  await page.getByRole("button", { name: "Social Media", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Creative brief" }).inputValue(), "Create social media campaign.");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  await page.getByRole("slider", { name: "Assistant width" }).focus();
  await page.keyboard.press("End");
  assert.equal(await page.locator(".dock").evaluate(element => Math.round(element.getBoundingClientRect().width)), 440);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.locator(".studioCard").first().evaluate(element => getComputedStyle(element).transform), "none");
  await page.getByRole("button", { name: "Collapse assistant" }).click();
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  for (const theme of ["dark", "light"]) {
    await page.evaluate(value => document.documentElement.dataset.vdsTheme = value, theme);
    await page.waitForTimeout(300);
    const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector(".center"), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })));
    assert.deepEqual(violations, [], `${theme} WCAG AA violations`);
    await page.screenshot({ path: path.join(output, `creative-${theme}.png`), fullPage: true });
  }
  await page.goto(`${url}/?empty`);
  await page.getByText("Your recent campaigns will appear here.").waitFor();
  await page.getByText("No templates available yet.").waitFor();
  assert.deepEqual(errors, []);
  console.log("Sprint 225 browser audit passed: seven viewport widths, 4/2/1 columns, dock containment, keyboard resizing, single floating action, filtering, empty states, modal focus/Escape, prompt reuse, and reduced motion. Screenshots: build/sprint225-audit.");
} finally { await browser.close(); server.close(); }
