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
  assert.match(overview, /unavailable until a governed source/);
  assert.match(overview, /ButtonLink/);
  assert.doesNotMatch(overview, /\$\d|\d+%|followers|impressions:\s*\d/i);
});

test("AI CMO prepares recommendations and preserves human approval", () => {
  const cmo = read("features/vayon/growth-intelligence/AiCmoPanel.tsx");
  assert.match(cmo, /Chief Marketing Officer/);
  assert.match(cmo, /Never auto-publishes/);
  assert.match(cmo, /No content was published/);
  assert.match(cmo, /disabled={!brief.trim\(\)}/);
  assert.doesNotMatch(cmo, /fetch\(|\/api\//);
});

test("calendar, campaigns, brand, social, PR, community and investor catalogs are complete", () => {
  const catalog = read("features/vayon/growth-intelligence/catalog.ts");
  const section = read("features/vayon/growth-intelligence/GrowthSectionPage.tsx");
  for (const value of ["Product Launch", "Investor Update", "Brand voice", "Media kit", "Podcast Outreach", "Discord", "Due diligence checklist"]) assert.match(catalog, new RegExp(value));
  for (const view of ["Day", "Week", "Month"]) assert.match(section, new RegExp(`"${view}"`));
  for (const field of ["Platform", "Status", "Objective", "Audience", "Campaign", "Owner", "Approval", "Publishing date"]) assert.match(catalog, new RegExp(field));
});
