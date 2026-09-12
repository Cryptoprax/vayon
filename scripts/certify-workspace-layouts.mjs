import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url);
const root = process.cwd(), output = resolve("test-results/workspaces"), fixture = resolve("tests/fixtures/workspace-unification");
await mkdir(`${output}/screenshots`, { recursive: true });
const compiled = require("next/dist/compiled/webpack/webpack");
await new Promise((resolveBuild, reject) => compiled.webpack({ mode: "development", devtool: false, entry: `${fixture}/entry.jsx`, output: { path: output, filename: "fixture.js" }, resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"], alias: { "@": root, "next/link$": `${fixture}/link.jsx`, "@/features/platform/design-system$": resolve("features/platform/design-system/components/core/Actions.tsx") } }, module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: `${fixture}/typescript-loader.mjs` }] } }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolveBuild()));
const postcss = require("postcss"), tailwind = require("@tailwindcss/postcss");
const css = await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), { from: resolve("app/globals.css") });
await writeFile(`${output}/fixture.css`, css.css);
const reference = await readFile("test-results/property-experience/inventory.html", "utf8");
const html = `<!doctype html><html lang="en" data-vds-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workspace layout QA</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script>window.propertyReference=${JSON.stringify(reference).replaceAll("<", "\\u003c")}</script><script src="/fixture.js"></script></body></html>`;
const server = createServer(async (req, res) => { if (req.url === "/fixture.js" || req.url === "/fixture.css") { res.setHeader("Content-Type", req.url.endsWith(".css") ? "text/css" : "text/javascript"); res.end(await readFile(output + req.url)); } else { res.setHeader("Content-Type", "text/html"); res.end(html); } });
await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
const browser = await chromium.launch({ headless: true });
const evidence = { kind: "Local browser presentation fixtures; not authenticated production certification", checks: [], screenshots: [], errors: [] };
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", error => evidence.errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}`;
  for (const [device, width, height] of [["mobile", 390, 844], ["tablet", 768, 1024], ["laptop", 1280, 900], ["desktop", 1440, 1000], ["ultrawide", 1920, 1080]]) {
    let referenceLayout;
    for (const workspace of ["properties", "leads", "clients", "companies", "tasks", "growth", "empty"]) {
      await page.setViewportSize({ width, height }); await page.goto(`${url}/?workspace=${workspace}`); await page.locator("h1").waitFor();
      const layout = await page.evaluate(() => {
        const h = document.querySelector("h1"), header = h.closest("header"), box = header.getBoundingClientRect(), container = document.querySelector(".vds-workspace-page, #main-content > .vayon-content-container").getBoundingClientRect();
        return { leftGutter: box.left-container.left, rightGutter: container.right-box.right, overflow: document.documentElement.scrollWidth > innerWidth, headingSize: getComputedStyle(h).fontSize, headerWidth: box.width, headerLeft: box.left, breadcrumbs: [...document.querySelectorAll('[aria-label="Breadcrumb"]')].filter(x => x.getBoundingClientRect().height > 0).length, docks: document.querySelectorAll("[data-workspace-assistant]").length };
      });
      assert.equal(layout.overflow, false, `${workspace}/${device}: horizontal overflow`);
      if (workspace === "properties") referenceLayout = layout;
      assert.equal(layout.headingSize, referenceLayout.headingSize, `${workspace}/${device}: reference heading size`);
      assert.equal(layout.rightGutter, referenceLayout.rightGutter, `${workspace}/${device}: fluid width and right gutter`);
      assert.equal(layout.leftGutter, referenceLayout.leftGutter, `${workspace}/${device}: reference left gutter`);
      assert.equal(layout.breadcrumbs, 1, `${workspace}/${device}: one visible breadcrumb`);
      if (workspace !== "properties") {
        assert.equal(layout.docks, 1);
        const toggle = page.getByRole("button", { name: "Open assistant", exact: true });
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
        assert.equal(await page.getByLabel("Ask the Real Estate Assistant").isVisible(), false);
        await toggle.scrollIntoViewIfNeeded(); await toggle.focus(); await page.keyboard.press("Enter");
        await page.getByLabel("Ask the Real Estate Assistant").waitFor();
        const overlap = await page.evaluate(() => { const dock = document.querySelector("[data-workspace-assistant]").getBoundingClientRect(), content = document.querySelector(".vds-workspace-main").getBoundingClientRect(); return dock.top < content.bottom; });
        assert.equal(overlap, false, `${workspace}/${device}: dock does not cover content`);
        assert.equal(await page.getByRole("button", { name: "Minimize VAYON Copilot" }).isVisible(), false);
        assert.equal(await page.getByRole("button", { name: "Enter full screen" }).isVisible(), false);
        if (workspace === "leads") { await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); const opened = `screenshots/assistant-open-${device}.png`; await page.screenshot({ path: `${output}/${opened}`, fullPage: true }); evidence.screenshots.push(opened); }
        await page.getByLabel("Ask the Real Estate Assistant").focus(); await page.keyboard.press("Escape");
        assert.equal(await page.getByRole("button", { name: "Open assistant", exact: true }).evaluate(e => e === document.activeElement), true);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      }
      const screenshot = `screenshots/${workspace}-${device}.png`;
      await page.screenshot({ path: `${output}/${screenshot}`, fullPage: true });
      evidence.screenshots.push(screenshot); evidence.checks.push({ workspace, device, ...layout, passed: true });
    }
  }
  for (const [theme, width] of [["dark",390],["light",390],["dark",1440],["light",1440]]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(`${url}/?workspace=empty`); await page.locator("h1").waitFor();
    await page.evaluate(value => document.documentElement.dataset.vdsTheme = value, theme);
    await page.waitForTimeout(300);
    const ratios = await page.evaluate(() => {
      const rgb = value => value.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance = color => rgb(color).map(x => x/255).map(x => x<=.04045 ? x/12.92 : ((x+.055)/1.055)**2.4).reduce((sum,x,i) => sum+x*[.2126,.7152,.0722][i],0);
      const header=document.querySelector('.vds-workspace-header'), bg=luminance(getComputedStyle(header).backgroundColor);
      const textRatios = [...header.querySelectorAll('h1,.vds-workspace-description')].map(el => { const foreground=luminance(getComputedStyle(el).color); return (Math.max(foreground,bg)+.05)/(Math.min(foreground,bg)+.05); });
      const action=document.querySelector('[data-empty-state] a'), buttonStyle=getComputedStyle(action), foreground=luminance(buttonStyle.color), background=luminance(buttonStyle.backgroundColor);
      return [...textRatios,(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)];
    });
    assert.ok(ratios.every(x => x >= 4.5), `${theme}/${width}: heading and description AA contrast`);
    assert.equal(await page.locator('[data-empty-state] a').count(),1);
    const screenshot=`screenshots/empty-${theme}-${width}.png`;
    await page.screenshot({path:`${output}/${screenshot}`,fullPage:true}); evidence.screenshots.push(screenshot);
    evidence.checks.push({theme,width,contrastRatios:ratios,oneEmptyStateAction:true,passed:true});
  }
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("vayon:copilot:open", {detail:{prompt:"Plan today's work"}})));
  await page.getByLabel("Ask the Real Estate Assistant").waitFor();
  assert.equal(await page.getByLabel("Ask the Real Estate Assistant").inputValue(), "Plan today's work");
  evidence.checks.push({externalAssistantAction:true,existingPromptPreserved:true,passed:true});
  assert.deepEqual(evidence.errors, []);
} finally { await browser.close(); server.close(); await Promise.all([unlink(`${output}/fixture.js`), unlink(`${output}/fixture.css`)]); await writeFile(`${output}/responsive-evidence.json`, JSON.stringify(evidence, null, 2)); }
console.log(`Passed ${evidence.checks.length} layout fixtures. Screenshots: ${output}/screenshots`);
