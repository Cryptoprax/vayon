import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url), root = process.cwd(), output = resolve(process.argv[2] ?? "test-results/members"), fixture = resolve("tests/fixtures/members");
await mkdir(`${output}/screenshots`, { recursive: true });
const compiled = require("next/dist/compiled/webpack/webpack");
await new Promise((done, reject) => compiled.webpack({ mode: "development", devtool: false, entry: `${fixture}/entry.jsx`, output: { path: output, filename: "fixture.js" }, resolve: { extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs"], alias: { "next/link$": resolve("tests/fixtures/workspace-unification/link.jsx"), "@/features/platform/design-system$": resolve("features/platform/design-system/components/core/Actions.tsx"), "@": root } }, plugins: [new compiled.webpack.NormalModuleReplacementPlugin(/organization\.actions$/, resource => { resource.request = `${fixture}/actions.mjs`; })], module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: `${fixture}/loader.mjs` }, { test: /\.css$/, type: "asset/source" }] } }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : done()));
const css = await require("postcss")([require("@tailwindcss/postcss")()]).process(await readFile("app/globals.css", "utf8"), { from: resolve("app/globals.css") });
await writeFile(`${output}/fixture.css`, css.css + "\n" + await readFile("features/platform/organization/components/MembersManagement.css", "utf8"));
const server = createServer(async (req, res) => {
  if (req.url === "/fixture.js" || req.url === "/fixture.css") { res.setHeader("Content-Type", req.url.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8"); res.end(await readFile(output + req.url)); }
  else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<!doctype html><html lang="en" data-vds-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Members UI QA</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch({ headless: true });
const evidence = { environment: "Local Chromium: actual Members components/CSS; QA records; server actions replaced with payload capture. Not production certification.", screens: [], before: [], interactions: [], errors: [] };
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", error => evidence.errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}`;
  for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1600, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url); await page.locator(".member-management-row").first().waitFor();
    const metrics = await page.evaluate(() => {
      const root = document.querySelector(".vayon-members");
      const overflowing = [...root.querySelectorAll("*")].filter(el => !el.closest("dialog:not([open])") && el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1 && !["INPUT", "SELECT"].includes(el.tagName)).map(el => `${el.tagName}.${el.className}`);
      const buttons = [...root.querySelectorAll(".member-management-row button")].filter(el => !el.closest("dialog"));
      const clippedButtons = buttons.filter(el => { const box = el.getBoundingClientRect(), row = el.closest("article").getBoundingClientRect(); return box.left < row.left || box.right > row.right + 1 || box.height < 44; }).length;
      return { documentOverflow: document.documentElement.scrollWidth > innerWidth, overflowing, clippedButtons, rows: root.querySelectorAll(".member-management-row").length, memberBeforeInvite: root.querySelector(".member-management-list").getBoundingClientRect().top < document.querySelector("#invite-team").getBoundingClientRect().top };
    });
    assert.equal(metrics.documentOverflow, false, `${width}: document overflow`); assert.deepEqual(metrics.overflowing, [], `${width}: content overflow`); assert.equal(metrics.clippedButtons, 0, `${width}: clipped or undersized actions`); assert.equal(metrics.memberBeforeInvite, true);
    await page.screenshot({ path: `${output}/screenshots/members-${width}.png` });
    const owner = page.getByRole("article", { name: "John Smith", exact: true });
    const trigger = owner.getByRole("button", { name: "View permissions for John Smith" });
    await trigger.focus(); await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "John Smith's permissions" }); await dialog.waitFor();
    assert.equal(await dialog.getByText("Billing", { exact: true }).count(), 1);
    assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `${width}: permission dialog overflow`);
    await page.screenshot({ path: `${output}/screenshots/permissions-${width}.png` });
    await page.keyboard.press("Tab"); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press("Shift+Tab"); assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    await page.keyboard.press("Escape"); assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    evidence.screens.push({ width, ...metrics, dialogKeyboardAndOverflow: "passed" });
    if (width === 390 || width === 1280) {
      await page.goto(`${url}/?before`); const table = page.locator("table"); await table.waitFor(); await table.scrollIntoViewIfNeeded();
      const overflow = await table.evaluate(el => el.parentElement.scrollWidth > el.parentElement.clientWidth);
      assert.equal(overflow, true); await page.screenshot({ path: `${output}/screenshots/before-${width}.png` }); evidence.before.push({ width, tableHorizontalScroll: overflow });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(url); await page.locator(".member-management-row").first().waitFor();
  const owner = page.getByRole("article", { name: "John Smith", exact: true });
  for (const action of ["Change role", "Suspend", "Remove"]) assert.equal(await owner.getByRole("button", { name: `${action} John Smith`.replace("Change role John", "Change role for John"), exact: true }).isDisabled(), true);
  const alex = page.getByRole("article", { name: "Alexandria Montgomery", exact: true });
  await alex.getByLabel("Role", { exact: true }).selectOption("sales_representative"); await alex.getByRole("button", { name: "Change role for Alexandria Montgomery" }).click();
  await alex.getByRole("button", { name: "Suspend Alexandria Montgomery" }).click(); await alex.getByRole("button", { name: "Remove Alexandria Montgomery" }).click();
  await page.getByRole("button", { name: "Reactivate Morgan Patel" }).click();
  const invite = page.locator("#invite-team"); await invite.getByLabel("Full name", { exact: true }).fill("QA Invited Teammate"); await invite.getByLabel("Business email", { exact: true }).fill("qa-invite@example.test");
  await invite.getByRole("button", { name: "Send invitation", exact: true }).click();
  await page.getByRole("button", { name: "Resend", exact: true }).click(); await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByLabel("New workspace owner", { exact: true }).selectOption("00000000-0000-4000-8000-000000000001"); await page.getByLabel("Type TRANSFER to confirm ownership transfer", { exact: true }).fill("TRANSFER"); await page.getByRole("button", { name: "Transfer ownership", exact: true }).click();
  const payloads = await page.evaluate(() => window.memberSubmissions);
  assert.deepEqual(payloads.slice(0, 4).map(x => x.values.intent), ["role", "suspend", "remove", "reactivate"]); assert.equal(payloads[0].values.role, "sales_representative");
  assert.equal(payloads[4].action, "invite"); assert.equal(payloads[4].values.role, "organization_admin"); assert.deepEqual(payloads.slice(5, 7).map(x => x.values.intent), ["resend", "cancel"]); assert.equal(payloads[7].values.confirmation, "TRANSFER");
  evidence.interactions.push({ ownerProtected: true, capturedExistingActions: payloads });
  await page.goto(`${url}/?readonly`); await page.locator(".member-management-row").first().waitFor();
  assert.equal(await page.locator('.member-management-row form button:not(:disabled), .member-management-row select:not(:disabled)').count(), 0); assert.equal(await page.getByRole("button", { name: "Send invitation", exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Transfer ownership", exact: true }).count(), 0); evidence.interactions.push({ readOnlyControlsProtected: true });
  await page.goto(`${url}/?solo`); await page.getByText("Your workspace currently has only you. Invite your team to collaborate.").waitFor(); evidence.interactions.push({ soloWorkspaceGuidancePreserved: true });
  for (const width of [390,1440]) {
    await page.setViewportSize({width,height:1000}); await page.goto(url); await page.locator('.member-management-row').first().waitFor();
    await page.evaluate(() => document.documentElement.dataset.vdsTheme='light'); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`${output}/screenshots/members-light-${width}.png`});
    const trigger=page.getByRole('button',{name:'View permissions for John Smith'}); await trigger.focus(); await page.keyboard.press('Space');
    await page.getByRole('dialog',{name:"John Smith's permissions"}).waitFor(); await page.getByRole('button',{name:'Close permissions',exact:true}).click();
    assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
    evidence.interactions.push({lightThemeWidth:width,dialogSpaceAndCloseButton:true,noHorizontalOverflow:true});
  }
  assert.deepEqual(evidence.errors, []);
} finally { await browser.close(); server.close(); await Promise.all([unlink(`${output}/fixture.js`), unlink(`${output}/fixture.css`)]); await writeFile(`${output}/browser-evidence.json`, JSON.stringify(evidence, null, 2)); }
console.log(`Passed ${evidence.screens.length} responsive widths, permission-dialog keyboard checks, lifecycle/invitation form payloads, and owner/read-only controls.`);
