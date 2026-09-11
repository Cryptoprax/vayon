import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const failureText = /this workspace view could not load|application error|internal server error|page (?:was |could )?not found|this page could not be found|coming soon/i;
export async function assertReady(page, { authenticated = true, timeout = 20000 } = {}) {
  await page.waitForFunction(({ authenticated, pattern }) => {
    const main = document.querySelector("#main-content") ?? document.querySelector("main");
    if (authenticated && /\/(login|signup)(\/|$)/.test(location.pathname)) return true;
    if (new RegExp(pattern, "i").test(document.body.innerText)) return true;
    if (!main || !main.innerText.trim()) return false;
    const visible = node => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0;
    return ![...main.querySelectorAll('[aria-busy="true"], [data-slot="skeleton"], .animate-pulse')].some(visible) && main.getAttribute("aria-busy") !== "true";
  }, { authenticated, pattern: failureText.source }, { timeout });
  if (authenticated && /\/(login|signup)(\/|$)/.test(new URL(page.url()).pathname)) throw new Error("Authenticated workflow redirected to authentication");
  if (failureText.test(await page.locator("body").innerText())) throw new Error("404, error boundary, or unfinished screen rendered");
  // Allow late hydration failures to surface without waiting for network-idle on polling pages.
  await page.waitForTimeout(500);
}

export async function certifyNavigation() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://vayon.online";
  const report = { generatedAt: new Date().toISOString(), baseURL, state: "Needs Verification", publicChecks: [], clicks: [], failures: [], coverage: [], limitations: [] };
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ storageState: process.env.PLAYWRIGHT_AUTH_STATE || undefined, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.request().resourceType() === "document" && response.status() >= 400) errors.push(`HTTP ${response.status()} document response`); });
    for (const path of ["/", "/login", "/vayon/dashboard", "/vayon/creative-studio/packs"]) {
      const response = await page.goto(new URL(path, baseURL).href, { waitUntil: "domcontentloaded", timeout: 45000 });
      report.publicChecks.push({ path, status: response?.status(), finalPath: new URL(page.url()).pathname, title: await page.title(), authenticated: !/\/login/.test(new URL(page.url()).pathname) && path.startsWith("/vayon/") });
    }
    if (!process.env.PLAYWRIGHT_AUTH_STATE) {
      report.limitations.push("No existing authenticated QA storage-state file supplied. Public HTTP responses and login redirects cannot certify workspace routes.");
      return report;
    }
    const queue = ["/vayon/dashboard"], visited = new Set(), checked = new Set();
    const openSource = async source => {
      errors.length = 0;
      await page.goto(new URL(source, baseURL).href, { waitUntil: "domcontentloaded" });
      await assertReady(page);
      if (errors.length) throw new Error(errors.join("; "));
      for (const summary of await page.locator('#vayon-sidebar details:not([open]) > summary').all()) await summary.click();
      const create = page.getByRole("button", { name: "Open Create menu", exact: true });
      if (await create.isVisible()) await create.click();
    };
    const checkClick = async (source, href, locator, surface) => {
      const key = `${surface}:${source}:${href}`;
      if (checked.has(key)) return;
      checked.add(key);
      try {
        errors.length = 0;
        const before = page.url();
        await locator.click({ timeout: 10000 });
        await page.waitForURL(url => url.pathname + url.search === href.split("#")[0] || url.href !== before, { timeout: 20000 });
        await assertReady(page);
        if (errors.length) throw new Error(errors.join("; "));
        report.clicks.push({ source, href, surface, finalPath: new URL(page.url()).pathname, state: "Certified" });
        // Crawl navigation destinations only: record-detail graphs may be unbounded.
        if (surface === "navigation" && !visited.has(href)) queue.push(href);
      } catch (error) { report.failures.push({ source, href, surface, reason: String(error.message) }); }
    };
    while (queue.length) {
      if (visited.size >= 150) throw new Error("Navigation crawl exceeded 150 pages; coverage incomplete");
      const source = queue.shift();
      if (visited.has(source)) continue;
      visited.add(source);
      await openSource(source);
      const candidates = await page.locator('nav a[href], #vayon-sidebar a[href], [role="menuitem"][href], main a[href]').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().width && node.getBoundingClientRect().height).map(node => ({ href: node.getAttribute("href"), surface: node.closest("#vayon-sidebar, nav") ? "navigation" : node.closest('[role="menu"]') ? "quick action" : "page link" })));
      for (const { href, surface } of candidates) {
        if (!href?.startsWith("/") || href.startsWith("//") || href.includes("#")) continue;
        if (/\/(api|logout|signout)(\/|$)/.test(href)) {
          report.failures.push({ source, href, reason: "Non-page or session mutation link requires separate verification; not clicked by read-only audit" });
          continue;
        }
        await openSource(source);
        const target = page.locator(`a[href=${JSON.stringify(href)}]:visible`).first();
        await checkClick(source, href, target, surface);
      }
      report.coverage.push(source);
    }
    // Click the real search buttons; never submit business forms or invite users.
    const queries = (process.env.ROUTE_SEARCH_QUERIES ?? "Invite,Team,Members,Properties,Leads,Campaign,Analytics,Settings,Tasks,Calendar").split(",");
    for (const query of queries) {
      await openSource("/vayon/dashboard");
      await page.keyboard.press("Control+k");
      const input = page.getByRole("combobox", { name: "Search, create, or navigate Vayon" });
      await input.fill(query);
      await page.waitForTimeout(1500);
      const hrefs = await page.locator("button[data-route-href]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-route-href")));
      if (!hrefs.length) report.failures.push({ surface: "search", query, reason: "No clickable results found" });
      for (const href of hrefs) {
        await openSource("/vayon/dashboard");
        await page.keyboard.press("Control+k");
        await page.getByRole("combobox", { name: "Search, create, or navigate Vayon" }).fill(query);
        const target = page.locator(`button[data-route-href=${JSON.stringify(href)}]`).first();
        await checkClick("/vayon/dashboard", href, target, `search:${query}`);
      }
    }
    report.limitations.push("Coverage is restricted to this session's visible navigation and sampled search results; repeat with each supported role and record fixture. Dynamic record destinations and other roles are not globally certified.");
    report.state = report.failures.length ? "Blocked" : "Certified";
  } catch (error) { report.failures.push({ reason: String(error.message) }); report.state = "Blocked"; }
  finally { await browser.close(); }
  return report;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await certifyNavigation();
  mkdirSync("test-results/routes", { recursive: true });
  writeFileSync("test-results/routes/browser-audit.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.state === "Certified" ? 0 : 1;
}
