import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const require = createRequire(import.meta.url), root = process.cwd();
const output = resolve("test-results/assistant-trial-ui"), fixture = resolve("tests/fixtures/layout-system");
await mkdir(`${output}/screenshots`, { recursive: true });
const webpack = require("next/dist/compiled/webpack/webpack");
await new Promise((done, fail) => webpack.webpack({ mode: "development", devtool: false, entry: `${fixture}/entry.jsx`, output: { path: output, filename: "fixture.js" }, resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"], alias: { "@": root, "next/link$": resolve("tests/fixtures/workspace-unification/link.jsx"), "@/features/platform/design-system$": resolve("features/platform/design-system/components/core/Actions.tsx") } }, module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: resolve("tests/fixtures/layout-system/loader.mjs") }] } }, (error, stats) => error || stats.hasErrors() ? fail(error || new Error(stats.toString({ all: false, errors: true }))) : done()));
const css = await require("postcss")([require("@tailwindcss/postcss")()]).process(await readFile("app/globals.css", "utf8"), { from: resolve("app/globals.css") });
await writeFile(`${output}/fixture.css`, css.css);
const html = "<!doctype html><html lang=\"en\" data-vds-theme=\"dark\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Assistant and trial QA</title><link rel=\"stylesheet\" href=\"/fixture.css\"></head><body><div id=\"root\"></div><script src=\"/fixture.js\"></script></body></html>";
const server = createServer(async (request, response) => { if (request.url === "/fixture.js" || request.url === "/fixture.css") { response.setHeader("Content-Type", request.url.endsWith(".css") ? "text/css" : "text/javascript"); response.end(await readFile(output + request.url)); return; } response.setHeader("Content-Type", "text/html"); response.end(html); });
await new Promise(done => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ headless: true });
const evidence = { environment: "Local Chromium with actual shared layout, assistant dock, trial banner, and CSS. Not an authenticated production session.", widths: [], interactions: [], errors: [] };
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", error => evidence.errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/?workspace=table`;
  for (const width of [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 760 }); await page.goto(url); await page.getByRole("button", { name: "Open VAYON assistant" }).waitFor();
    const before = await page.locator("[aria-label='Workspace trial']").boundingBox();
    assert.ok(before?.y >= 0, `${width}: trial banner begins in normal page flow`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: horizontal overflow`);
    const assistant = page.getByRole("button", { name: "Open VAYON assistant" });
    assert.equal(await assistant.evaluate(element => element.textContent?.trim()), "", `${width}: icon-only trigger`);
    assert.equal(await assistant.evaluate(element => getComputedStyle(element).backgroundColor), "rgb(20, 184, 106)", `${width}: primary launcher is visible before hover`);
    assert.equal(await assistant.evaluate(element => getComputedStyle(element).color), "rgb(6, 19, 13)", `${width}: icon contrast uses the accent token`);
    const assistantBox = await assistant.boundingBox();
    assert.ok(assistantBox && assistantBox.width >= 44 && assistantBox.height >= 44, `${width}: touch target`);
    await assistant.focus(); await expect(page.getByRole("tooltip", { name: "VAYON Assistant" })).toBeVisible(); await page.keyboard.press("Enter");
    await page.getByLabel("Ask assistant", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Close VAYON assistant" }).count(), 1, `${width}: existing assistant opens`);
    await page.getByLabel("Ask assistant", { exact: true }).focus(); await page.keyboard.press("Escape");
    assert.equal(await assistant.evaluate(element => element === document.activeElement), true, `${width}: escape restores trigger focus`);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    const after = await page.locator("[aria-label='Workspace trial']").boundingBox();
    assert.ok((after?.y ?? 0) < 0, `${width}: trial banner scrolls away`);
    const fixed = await assistant.boundingBox();
    assert.ok(fixed && Math.abs(fixed.x + fixed.width - (width - 16)) < 3, `${width}: assistant stays bottom-right`);
    await page.screenshot({ path: `${output}/screenshots/${width}.png` });
    evidence.widths.push({ width, overflow: false, iconOnly: true, primaryAtRest: true, touchTarget: true, trialScrollsAway: true, assistantFixed: true });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(url);
  await page.evaluate(() => { const dialog = document.createElement("dialog"); dialog.textContent = "QA modal"; document.body.append(dialog); dialog.showModal(); });
  await expect(page.locator(".vds-workspace-assistant")).toBeHidden();
  evidence.interactions.push({ keyboard: "Enter opens and Escape restores focus", tooltip: "Visible on focus", modal: "Assistant hides beneath native dialog" });
  assert.deepEqual(evidence.errors, []);
} finally {
  await browser.close(); await new Promise(done => server.close(done));
  await Promise.all([unlink(`${output}/fixture.js`), unlink(`${output}/fixture.css`)]);
  await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2));
}
console.log(`PASS assistant and trial banner audit at ${evidence.widths.length} widths.`);
