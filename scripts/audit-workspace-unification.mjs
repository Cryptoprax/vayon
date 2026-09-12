import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";

const read = path => readFileSync(path, "utf8");
const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name).replaceAll("\\", "/")]);
const git = args => execFileSync("git", ["-c", "core.safecrlf=false", ...args], { encoding: "utf8" }).trim();
const primary = [
  ["Dashboard", "/vayon/dashboard", "features/vayon/dashboard/components/DashboardShell.tsx"],
  ["Leads", "/vayon/leads", "app/vayon/leads/page.tsx"],
  ["Clients", "/vayon/crm/contacts", "features/vayon/crm-engine/components/CrmShell.tsx"],
  ["Companies", "/vayon/crm/companies", "features/vayon/crm-engine/components/CrmShell.tsx"],
  ["Deals", "/vayon/deals", "app/vayon/deals/page.tsx"],
  ["Inbox", "/vayon/notifications", "app/vayon/notifications/page.tsx"],
  ["Schedule Viewing", "/vayon/site-visits", "app/vayon/site-visits/page.tsx"],
  ["Calendar", "/vayon/calendar", "app/vayon/calendar/page.tsx"],
  ["Tasks", "/vayon/tasks", "app/vayon/tasks/page.tsx"],
  ["Timeline", "/vayon/timeline", "app/vayon/timeline/page.tsx"],
  ["Communications", "/vayon/communications", "features/vayon/communications-workspace/components/CommunicationsShell.tsx"],
  ["Marketing / Growth", "/vayon/growth", "features/vayon/growth-intelligence/GrowthOverview.tsx"],
  ["Analytics", "/vayon/analytics", "features/vayon/analytics-platform/dashboard/AnalyticsRoute.tsx"],
  ["Workspace Settings", "/vayon/settings/organization", "app/vayon/settings/organization/page.tsx"],
  ["Team", "/vayon/settings/members", "app/vayon/settings/members/page.tsx"],
  ["Creative", "/vayon/creative", "features/vayon/creative-studio-2/CreativeStudioHome.tsx"],
  ["Campaigns", "/vayon/creative/campaigns", "features/vayon/creative-studio/components/StudioViews.tsx"],
  ["Approvals", "/vayon/approvals", "app/vayon/approvals/page.tsx"],
].map(([name, route, layout]) => ({ name, route, layout, sourceMigrated: /WorkspaceContent/.test(read(layout)) }));
const primitives = ["WorkspaceHeader", "WorkspaceActionBar", "WorkspaceAttentionPanel", "WorkspaceFilters", "WorkspaceContent", "WorkspaceEmptyState", "WorkspacePagination", "WorkspaceAssistantDock", "WorkspacePageLayout"];
const source = read("features/platform/design-system/layout/WorkspaceLayouts.tsx");
const changed = git(["diff", "--name-only"]).split("\n").filter(Boolean);
const referencePath = "app/vayon/properties/page.tsx";
const normalizedHash = value => createHash("sha256").update(value.replaceAll("\r\n", "\n")).digest("hex");
const reference = { path: referencePath, current: normalizedHash(read(referencePath)), baseline: normalizedHash(execFileSync("git", ["show", `HEAD:${referencePath}`], { encoding: "utf8" })) };
const checks = {
  allPrimaryLayoutsMigrated: primary.every(x => x.sourceMigrated),
  nineSharedPrimitives: primitives.every(name => source.includes(`export function ${name}`)),
  noFetchingInLayout: !/fetch\(|supabase|Repository|Service/.test(source),
  propertiesReferenceUnchanged: reference.current === reference.baseline && !changed.some(path => /^(app\/vayon\/properties\/|features\/vayon\/property\/)/.test(path)),
  architectureUnchanged: !changed.some(path => /\/repositories\/|\/services\/|\/migrations\/|\/schemas\/|^app\/api\/|^lib\/supabase\//.test(path)),
  sharedDockConnected: /WorkspaceAssistantDock key={path}/.test(read("features/vayon/components/ProductExperience.tsx")),
  creativeUsesSharedDock: /vayon:copilot:open/.test(read("features/vayon/creative-studio-2/CreativeStudioHome.tsx")) && !/creative-assistant-dock|<FloatingSurface/.test(read("features/vayon/creative-studio-2/CreativeStudioHome.tsx")),
};
const pages = walk("app/vayon").filter(path => path.endsWith("/page.tsx")).map(path => ({ path, route: path.replace(/^app/, "").replace(/\/page.tsx$/, ""), category: path.includes("/properties/") ? "Properties reference family preserved" : /\bredirect\(/.test(read(path)) && !/return\s*</.test(read(path)) ? "Existing redirect" : "Shared ProductExperience envelope; page-specific runtime verification pending" }));
const legacy = [
  { path: "app/platform/layout.tsx", reason: "Founder-only Mission Control is a separate administrative shell; not migrated to the customer workspace shell." },
  { path: "app/vayon/loading.tsx", reason: "Shared loading boundary also serves Properties. Preserved to avoid changing the reference family." },
  { path: "features/vayon/components/RouteStates.tsx", reason: "Shared loading/error markup preserved; the commercial envelope removes its extra width/gutters only on migrated routes." },
  { path: "features/vayon/property-platform", reason: "Property-specific inventory/detail layouts preserved under the no-Properties-redesign rule." },
  { path: "features/vayon/demo-experience/components/DemoExperience.tsx", reason: "Public demo shell is not an authenticated commercial workspace." },
];
mkdirSync("test-results/workspaces", { recursive: true });
writeFileSync("test-results/workspaces/source-audit.json", JSON.stringify({ evidence: "Source audit only; does not certify authenticated page rendering", checks, primary, reference, pages, legacy }, null, 2));
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
console.log(`${primary.length} canonical primary workspace layouts; ${pages.length} VAYON page routes inventoried.`);
if (Object.values(checks).includes(false)) process.exitCode = 1;
