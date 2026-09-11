import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPureModule } from "./audit-product-unification.mjs";

export function auditCustomerRoutes() {
  const { shellNavigation } = loadPureModule("features/vayon/product-shell/navigation.ts");
  const { quickCreateActions } = loadPureModule("features/vayon/universal-bar/config/quick-create.ts");
  const { vayonNavigation } = loadPureModule("features/platform/builder/config/vayon-navigation.ts");
  const { growthSectionSlugs } = loadPureModule("features/vayon/growth-intelligence/catalog.ts");
  const creativeAliases = [...readFileSync("app/vayon/creative/[studio]/page.tsx", "utf8").matchAll(/^\s*(?:"([\w-]+)"|(\w+)):\s*"(\/[^\"]+)"/gm)].map(match => ({ source: `/vayon/creative/${match[1] ?? match[2]}`, destination: match[3] }));
  const { canonicalRouteRedirects, canonicalCustomerHref, isCustomerRouteExposed, hiddenCustomerRoutes } = loadPureModule("config/canonical-routes.ts");
  const files = readdirSync("app", { recursive: true }).map(String).map(path => path.replaceAll("\\", "/"));
  const pages = files.filter(path => /(^|\/)page\.tsx$/.test(path)).map(file => ({ file: `app/${file}`, route: "/" + file.replace(/(^|\/)page\.tsx$/, "").split("/").filter(part => !part.startsWith("(") && !part.startsWith("@")).join("/") }));
  const matchingPage = href => pages.find(page => page.route === href.split(/[?#]/)[0]) ?? pages.find(page => new RegExp("^" + page.route.split("/").map(part => part.startsWith("[...") ? ".+" : part.startsWith("[") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/") + "$").test(href.split(/[?#]/)[0]));
  const issues = [];
  const inventory = shellNavigation.flatMap(group => group.items.map(item => ({ group: group.label, label: item.label, href: item.href, surface: "sidebar" }))).concat(quickCreateActions.map(item => ({ label: item.label, href: item.href, surface: "quick action" })), vayonNavigation.filter(item => item.href).map(item => ({ label: item.label, href: item.href, surface: "builder navigation" }))).map(item => {
    const canonical = canonicalCustomerHref(item.href), page = matchingPage(canonical);
    if (!page) issues.push(`Missing page: ${item.href}`);
    if (page?.route === "/vayon/growth/[section]" && !growthSectionSlugs.includes(canonical.split(/[?#]/)[0].split("/").at(-1))) issues.push(`Unknown growth section: ${canonical}`);
    if (page?.route === "/vayon/creative/[studio]" && !creativeAliases.some(alias => alias.source === canonical)) issues.push(`Unknown creative studio: ${canonical}`);
    if (item.surface === "sidebar" && (!isCustomerRouteExposed(canonical) || canonical !== item.href)) issues.push(`Hidden or legacy sidebar destination: ${item.href}`);
    return { ...item, canonical, page: page?.file ?? null, exposed: isCustomerRouteExposed(canonical), sourceResolution: page ? (page.route.includes("[") ? "Dynamic page: runtime parameters require verification" : "Page exists") : "Missing", runtime: "Needs Verification" };
  });
  for (const redirect of canonicalRouteRedirects) {
    if (canonicalRouteRedirects.some(other => other.source === redirect.destination)) issues.push(`Redirect chain: ${redirect.source}`);
    if (!matchingPage(redirect.destination)) issues.push(`Missing redirect target: ${redirect.destination}`);
  }
  const legacyReferences = [], pageRedirects = [];
  for (const root of ["app", "features", "config"]) for (const entry of readdirSync(root, { recursive: true }).map(String).filter(file => /\.tsx?$/.test(file))) {
    const file = `${root}/${entry.replaceAll("\\", "/")}`, source = readFileSync(file, "utf8");
    source.split(/\r?\n/).forEach((line, index) => {
      if (/creative-studio|\bpacks\b|legacy route|removed route/i.test(line)) legacyReferences.push({ file, line: index + 1, category: /from\s+["']/.test(line) ? "Implementation import" : /\/vayon\//.test(line) ? "Route reference (aliases and editor retained)" : "Non-navigation reference" });
    });
    for (const match of source.matchAll(/(?:redirect|permanentRedirect)\(\s*["'](\/[^"']+)["']/g)) pageRedirects.push({ file, destination: match[1], canonical: canonicalCustomerHref(match[1]), page: matchingPage(canonicalCustomerHref(match[1]))?.file ?? null });
  }
  for (const alias of creativeAliases) if (!matchingPage(alias.destination)) issues.push(`Missing creative alias target: ${alias.destination}`);
  for (const redirect of pageRedirects) if (!redirect.page) issues.push(`Missing page redirect target: ${redirect.destination} in ${redirect.file}`);
  return { generatedAt: new Date().toISOString(), state: "Needs Verification", inventory, redirects: canonicalRouteRedirects, creativeAliases, hiddenRoutes: hiddenCustomerRoutes, pageRedirects, legacyReferences, issues, limitation: "Source existence is not evidence of rendering, tenant availability, valid dynamic records, or RBAC. Browser certification must pass separately for each supported role." };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditCustomerRoutes();
  mkdirSync("test-results/routes", { recursive: true });
  writeFileSync("test-results/routes/static-audit.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ destinations: result.inventory.length, redirects: result.redirects.length, issues: result.issues, state: result.state }, null, 2));
  process.exitCode = result.issues.length ? 1 : 0;
}
