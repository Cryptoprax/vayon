import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Execute only the pure navigation/search/command modules during this source audit.
export function loadPureModule(file) {
  const filename = resolve(root, file);
  const source = readFileSync(filename, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = name => name.startsWith("@/") ? loadPureModule(name.slice(2) + ".ts") : name.startsWith(".") ? loadPureModule(resolve(dirname(filename), name + ".ts")) : require(name);
  new Function("require", "module", "exports", code)(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
export function auditUnification() {
  const { shellNavigation } = loadPureModule("features/vayon/product-shell/navigation.ts");
  const { StaticNavigationSearchProvider } = loadPureModule("features/vayon/universal-bar/providers/static-navigation.provider.ts");
  const { resolveOperatingSystemCommand } = loadPureModule("features/vayon/cross-module-intelligence/command-router.ts");
  const issues = [];
  const expected = ["Today's work", "Sell & follow up", "Market properties", "AI Assistant", "Understand performance", "Configure workspace"];
  if (JSON.stringify(shellNavigation.map(group => group.label)) !== JSON.stringify(expected)) issues.push("Primary navigation must contain six customer jobs in order.");
  const items = shellNavigation.flatMap(group => group.items);
  if (new Set(items.map(item => item.href)).size !== items.length) issues.push("Navigation contains duplicate destinations.");
  const inventory = readdirSync(resolve(root, "app"), { recursive: true }).map(file => String(file).replaceAll("\\", "/"))
    .filter(file => file.endsWith("/page.tsx") || file === "page.tsx")
    .map(file => ({ route: "/" + file.replace(/(^|\/)page\.tsx$/, "").split("/").filter(part => !part.startsWith("(") && !part.startsWith("@")).join("/") }));
  const routeExists = href => inventory.some(item => new RegExp("^" + item.route.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+") + "$").test(href.split("?")[0]));
  for (const item of items) if (!routeExists(item.href)) issues.push(`Missing destination: ${item.href}`);
  const navigation = items.map((item, order) => ({...item, id:item.href, visible:true, order, surface:"sidebar"}));
  const search = new StaticNavigationSearchProvider(navigation);
  for (const query of ["property", "lead", "company", "campaign", "templates", "analytics", "billing"]) {
    if (!search.search({query,scopes:search.scopes}).length) issues.push(`Search has no match for ${query}`);
  }
  const forbidden = new StaticNavigationSearchProvider([]).search({query:"create",scopes:search.scopes});
  if (forbidden.length) issues.push("Actions exposed without permitted navigation.");
  for (const query of ["Generate Brochure", "Call Buyer", "Follow up tomorrow", "Landing Page", "Logo"]) {
    if (resolveOperatingSystemCommand(query).intent === "ask-workforce") issues.push(`Workflow is not routed: ${query}`);
  }
  const journey = ["/signup", "/vayon/dashboard", "/vayon/properties/new", "/vayon/leads/new", "/vayon/settings/members", "/vayon/creative/campaigns", "/vayon/tasks"];
  for (const path of journey.slice(1)) if (!routeExists(path)) issues.push(`Journey route missing: ${path}`);
  const sidebar = readFileSync(resolve(root,"features/vayon/product-shell/ShellSidebar.tsx"),"utf8");
  if (!sidebar.includes("filterNavigationForRole")) issues.push("Existing permission filter is not applied.");
  return { primaryGroups: expected, destinations: items.length, pageFiles: inventory.length, issues, browserVerified: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditUnification();
  console.log(JSON.stringify({ requestedAudit: process.argv[2] ?? "all", ...result },null,2));
  process.exitCode = result.issues.length ? 1 : 0;
}
