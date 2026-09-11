import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { loadPureModule } from "./audit-product-unification.mjs";

export function auditMarketingWorkflows() {
  const { allGrowthSections } = loadPureModule("features/vayon/growth-intelligence/catalog.ts");
  const { canonicalCustomerHref, isCustomerRouteExposed, canonicalRouteRedirects } = loadPureModule("config/canonical-routes.ts");
  const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean))];
  const pages = readdirSync("app", { recursive: true }).map(String).map(path => path.replaceAll("\\", "/")).filter(path => /(^|\/)page\.tsx$/.test(path)).map(file => ({ file: `app/${file}`, route: "/" + file.replace(/(^|\/)page\.tsx$/, "").split("/").filter(part => !part.startsWith("(") && !part.startsWith("@")).join("/") }));
  const pageFor = href => pages.find(page => page.route === href.split(/[?#]/)[0]) ?? pages.find(page => new RegExp("^" + page.route.split("/").map(part => part.startsWith("[") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/") + "$").test(href.split(/[?#]/)[0]));
  const keywords = /\b(campaigns?|creative|packs|marketing|brief|creative-studio)\b/i;
  const repositoryMatches = [], routeReferences = [], controls = [];
  for (const file of files.filter(file => /\.(tsx?|mjs|md|json|sql)$/.test(file) && !file.startsWith("test-results/"))) {
    if (!existsSync(file)) continue;
    const source = readFileSync(file, "utf8");
    if (!keywords.test(source)) continue;
    repositoryMatches.push({ file, lines: source.split(/\r?\n/).flatMap((line, index) => keywords.test(line) ? [index + 1] : []) });
    if (!/\.(tsx?|mjs)$/.test(file) || file.startsWith("tests/") || file.startsWith("scripts/")) continue;
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
      const line = tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1;
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text.startsWith("/vayon/") && keywords.test(node.text)) {
        const canonical = canonicalCustomerHref(node.text);
        routeReferences.push({ file, line, href: node.text, canonical, exposed: isCustomerRouteExposed(canonical), page: pageFor(canonical)?.file ?? null, runtime: "Needs Verification" });
      }
      if (/growth-intelligence|creative-studio|campaign-studio|brand-studio|document-studio|image-studio|video-studio/.test(file) && (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^(Button|ButtonLink|Link|a|button|form)$/.test(node.tagName.getText(tree))) {
        const props = Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(attr => [attr.name.getText(tree), attr.initializer?.getText(tree) ?? "true"]));
        controls.push({ file, line, element: node.tagName.getText(tree), href: props.href ?? null, action: props.action ?? props.onClick ?? null, disabled: props.disabled ?? null, label: props["aria-label"] ?? (ts.isJsxElement(node.parent) ? node.parent.children.filter(ts.isJsxText).map(child => child.text.trim()).filter(Boolean).join(" ") : ""), classification: props.disabled === "true" ? "Permanently disabled control; verify whether mounted" : props.href ? "Destination requires runtime verification" : props.action ? "Form action requires mutation verification" : props.onClick ? "In-page interaction requires runtime verification" : "Inspect composed control" });
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  const growthActions = Object.entries(allGrowthSections).map(([slug, section]) => ({ source: `/vayon/growth/${slug}`, label: section.action, href: section.actionHref, canonical: canonicalCustomerHref(section.actionHref), page: pageFor(section.actionHref)?.file ?? null }));
  const issues = growthActions.flatMap(item => !item.page ? [`Missing Growth CTA destination: ${item.href}`] : item.href !== item.canonical ? [`Legacy Growth CTA: ${item.href}`] : []);
  for (const item of routeReferences) if (!item.page) issues.push(`Unresolved marketing route: ${item.href} in ${item.file}:${item.line}`);
  const campaignPage = readFileSync("app/vayon/creative/campaigns/page.tsx", "utf8");
  if (!campaignPage.includes("<CampaignWizard") || campaignPage.includes("<CampaignStudio ")) issues.push("Canonical Campaigns page must reuse the persistence-backed wizard, not the disabled prototype");
  return { generatedAt: new Date().toISOString(), state: "Needs Verification", repositoryMatches, routeReferences, controls, growthActions, redirects: canonicalRouteRedirects, issues, limitation: "Source inventory is not runtime certification. Unmounted prototype controls are included for audit transparency. Database writes require an authenticated QA workspace." };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditMarketingWorkflows();
  mkdirSync("test-results/marketing", { recursive: true });
  writeFileSync("test-results/marketing/source-inventory.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ matchedFiles: report.repositoryMatches.length, routeReferences: report.routeReferences.length, controls: report.controls.length, growthActions: report.growthActions.length, issues: report.issues, state: report.state }, null, 2));
  process.exitCode = report.issues.length ? 1 : 0;
}
