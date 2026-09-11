import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { assertReady } from "./certify-customer-navigation.mjs";
import { loadPureModule } from "./audit-product-unification.mjs";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://vayon.online";
const { customerGrowthSectionSlugs } = loadPureModule("features/vayon/growth-intelligence/catalog.ts");
const seeds = ["/vayon/growth", "/vayon/creative", "/vayon/creative/campaigns", ...customerGrowthSectionSlugs.map(slug => `/vayon/growth/${slug}`)];
const report = { generatedAt: new Date().toISOString(), baseURL, state: "Needs Verification", pages: [], clicks: [], forms: [], controls: [], failures: [], limitations: [] };
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ storageState: process.env.PLAYWRIGHT_AUTH_STATE || undefined, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400 && ["document", "fetch", "xhr"].includes(response.request().resourceType())) errors.push(`HTTP ${response.status()} ${response.request().resourceType()}`); });
  const ready = async () => {
    await assertReady(page);
    if (errors.length) throw new Error(errors.join("; "));
    if (/\bplaceholder\b|this workspace view could not load|not connected yet|not ready yet/i.test(await page.locator("main").last().innerText())) throw new Error("Placeholder or unfinished marketing workflow rendered");
  };
  const open = async href => {
    errors.length = 0;
    const response = await page.goto(new URL(href, baseURL).href, { waitUntil: "domcontentloaded", timeout: 45000 });
    return { source: href, status: response?.status(), finalPath: new URL(page.url()).pathname };
  };
  if (!process.env.PLAYWRIGHT_AUTH_STATE) {
    for (const href of seeds) {
      try { report.pages.push({ ...await open(href), state: "Needs Verification" }); }
      catch (error) { report.failures.push({ source: href, reason: error.message }); }
    }
    report.limitations.push("No authenticated QA storage-state file supplied. Login responses are not workflow certification; no workspace CTA or mutation was exercised.");
  } else {
    const queue = [...seeds], visited = new Set(), checked = new Set();
    while (queue.length) {
      if (visited.size >= 100) throw new Error("Marketing crawl exceeded 100 pages; incomplete coverage");
      const source = queue.shift();
      if (visited.has(source)) continue;
      visited.add(source);
      try {
        const observation = await open(source);
        await ready();
        report.pages.push({ ...observation, state: "Certified" });
        const links = await page.locator('main a[href]:visible, main button[data-route-href]:visible').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute("href") ?? node.getAttribute("data-route-href"), label: node.textContent.trim(), tag: node.tagName.toLowerCase() })));
        report.forms.push(...await page.locator("main form").evaluateAll(forms => forms.map(form => ({ method: form.getAttribute("method") ?? "get", buttons: [...form.querySelectorAll('button[type="submit"], button:not([type])')].map(button => button.textContent.trim()) }))).then(forms => forms.map(form => ({ source, ...form, state: "Needs Verification" }))));
        report.controls.push(...await page.locator("main button:visible").evaluateAll(nodes => nodes.map(node => ({ label: node.getAttribute("aria-label") ?? node.textContent.trim(), disabled: node.disabled }))).then(controls => controls.map(control => ({ source, ...control, state: "Needs Verification" }))));
        for (const link of links) {
          if (!link.href?.startsWith("/") || link.href.startsWith("//") || link.href.includes("#")) continue;
          if (/\/(api|logout|signout)(\/|$)/.test(link.href)) { report.limitations.push(`Non-page action requires separate verification: ${source} -> ${link.href}`); continue; }
          const key = `${source}:${link.href}`;
          if (checked.has(key)) continue;
          checked.add(key);
          try {
            await open(source);
            await ready();
            const before = page.url();
            const attribute = link.tag === "a" ? "href" : "data-route-href";
            await page.locator(`main ${link.tag}[${attribute}=${JSON.stringify(link.href)}]:visible`).first().click();
            await page.waitForURL(url => url.href !== before || url.pathname + url.search === link.href, { timeout: 20000 });
            await ready();
            report.clicks.push({ source, ...link, finalPath: new URL(page.url()).pathname, state: "Certified" });
            if (/^\/vayon\/(creative|creative-studio|growth)(\/|$)/.test(link.href) && !visited.has(link.href)) queue.push(link.href);
          } catch (error) { report.failures.push({ source, ...link, reason: error.message }); }
        }
      } catch (error) { report.failures.push({ source, reason: error.message }); }
    }
    report.limitations.push("Read-only crawl: save/generate/publish/upload actions, modal controls, arbitrary records and other roles are not certified. Run those in an authorized QA tenant; never infer successful persistence from a loaded form.");
  }
  if (report.failures.length) report.state = "Blocked";
} catch (error) { report.failures.push({ reason: error.message }); report.state = "Blocked"; }
finally { await browser.close(); }
mkdirSync("test-results/marketing", { recursive: true });
writeFileSync("test-results/marketing/browser-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.state === "Certified" ? 0 : 1;
