import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");

test("Growth Intelligence is a first-class sidebar module", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  assert.match(navigation, /label: "Growth Intelligence"/);
  for (const route of ["campaigns", "content-calendar", "social-media", "brand-assets", "seo", "pr", "community", "influencers", "referrals", "analytics", "investor-relations", "settings"]) assert.match(navigation, new RegExp(`/vayon/growth/${route}`));
  assert.ok(existsSync(new URL("app/vayon/growth/[section]/page.tsx", root)));
});

test("executive overview is evidence-safe and every surface offers a next action", () => {
  const overview = read("features/vayon/growth-intelligence/GrowthOverview.tsx");
  for (const surface of ["Content Queue", "Campaign Pipeline", "Publishing Status", "Brand Health", "Community Growth", "Traffic Snapshot", "Lead Generation", "Upcoming Launches", "Recent Wins"]) assert.match(overview, new RegExp(surface));
  assert.match(overview, /No governed traffic source is connected/);
  assert.match(overview, /ButtonLink/);
  assert.doesNotMatch(overview, /\$\d|\d+%|followers|impressions:\s*\d/i);
});

test("AI CMO prepares recommendations and preserves human approval", () => {
  const cmo = read("features/vayon/growth-intelligence/StrategyWorkspace.tsx");
  assert.match(cmo, /Strategy Generator/);
  assert.match(cmo, /Nothing executes automatically/);
  assert.match(cmo, /Add to review queue/);
  assert.match(cmo, /disabled={!goal.trim\(\) \|\| !audience.trim\(\)}/);
  assert.doesNotMatch(cmo, /fetch\(|\/api\//);
});

test("calendar, campaigns, brand, social, PR, community and investor catalogs are complete", () => {
  const catalog = read("features/vayon/growth-intelligence/catalog.ts");
  const section = read("features/vayon/growth-intelligence/GrowthSectionPage.tsx");
  for (const value of ["Product Launch", "Investor Update", "Brand voice", "Media kit", "Podcast Outreach", "Discord", "Due diligence checklist"]) assert.match(catalog, new RegExp(value));
  for (const view of ["Day", "Week", "Month"]) assert.match(section, new RegExp(`"${view}"`));
  for (const field of ["Platform", "Status", "Objective", "Audience", "Campaign", "Owner", "Approval", "Publishing date"]) assert.match(catalog, new RegExp(field));
});
