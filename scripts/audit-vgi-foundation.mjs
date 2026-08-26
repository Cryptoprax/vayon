import { existsSync, readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const failures = [];
const requireText = (source, pattern, message) => { if (!pattern.test(source)) failures.push(message); };
const navigation = read("features/vayon/product-shell/navigation.ts");
const catalog = read("features/vayon/growth-intelligence/catalog.ts");
const overview = read("features/vayon/growth-intelligence/GrowthOverview.tsx");
const cmo = read("features/vayon/growth-intelligence/StrategyWorkspace.tsx");
const calendar = read("features/vayon/growth-intelligence/GrowthSectionPage.tsx");

for (const label of ["Overview", "Campaigns", "Content Calendar", "Social Media", "Brand Assets", "SEO", "PR", "Community", "Influencers", "Referrals", "Analytics", "Investor Relations", "Settings"]) requireText(navigation, new RegExp(`label: "${label}"`), `Sidebar is missing ${label}.`);
for (const surface of ["Today's Recommendation", "Content Queue", "Campaign Pipeline", "Publishing Status", "Brand Health", "Community Growth", "Traffic Snapshot", "Lead Generation", "Upcoming Launches", "Recent Wins"]) requireText(overview, new RegExp(surface.replace("'", "&apos;"), "i"), `Overview is missing ${surface}.`);
for (const status of ["Planning", "Draft", "Review", "Scheduled", "Published", "Completed"]) requireText(catalog, new RegExp(status), `Campaign status is missing ${status}.`);
for (const platform of ["LinkedIn", "X", "Instagram", "Threads", "Facebook", "TikTok", "YouTube"]) requireText(catalog, new RegExp(`"${platform}"`), `Social workspace is missing ${platform}.`);
for (const view of ["Day", "Week", "Month"]) requireText(calendar, new RegExp(`"${view}"`), `Calendar is missing ${view} view.`);
requireText(cmo, /Nothing executes automatically/, "AI CMO approval boundary is missing.");
requireText(cmo, /Strategy Generator/, "AI CMO strategy preparation is missing.");
if (!existsSync(new URL("../app/vayon/growth/[section]/page.tsx", import.meta.url))) failures.push("Growth section route is missing.");
for (const source of [catalog, overview, cmo, calendar]) if (/lorem ipsum/i.test(source)) failures.push("Placeholder lorem ipsum is forbidden.");
if (failures.length) { console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n")); process.exit(1); }
console.log("VGI audit passed: navigation, executive surfaces, calendar, campaign taxonomy, AI approval, and actionable states are present.");
