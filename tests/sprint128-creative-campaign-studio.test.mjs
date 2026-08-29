import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Campaign Studio reuses Creative and Brand services", () => {
  const service = read("features/vayon/campaign-studio/service.ts");
  assert.match(service, /CreativeStudioService\.production/);
  assert.match(service, /BrandStudioService\.production/);
  assert.doesNotMatch(service, /createClient|fetch\(|service_role/i);
});
test("campaign wizard contains seven planning steps and full deliverable groups", () => {
  const ui = read("features/vayon/campaign-studio/CampaignStudio.tsx"),
    catalog = read("features/vayon/campaign-studio/catalog.ts");
  for (const value of [
    "Campaign Details",
    "Campaign Objective",
    "Target Audience",
    "Brand",
    "Deliverables",
    "Campaign Style",
    "Creative Recommendation",
    "Branding",
    "Marketing",
    "Website",
    "Sales",
    "Social Media",
    "Advertising",
    "Images",
    "Videos",
    "Email",
    "Documents",
  ])
    assert.ok(`${ui}${catalog}`.includes(value), value);
});
test("Creative Director produces deterministic non-executing blueprints", () => {
  const director = read("features/vayon/campaign-studio/creative-director.ts");
  for (const value of [
    "estimatedOutputs",
    "estimatedCompletionDays",
    "brandReadiness",
    "creativeReadiness",
    "creativeScore",
    "completeness",
    "requiredApprovals",
    "missingAssets",
    "recommendations",
    "risks",
    'providerState: "unavailable"',
    "executionEnabled: false",
  ])
    assert.ok(director.includes(value), value);
  assert.doesNotMatch(director, /fetch\(|generateImage|openai/i);
});
test("all creative departments lifecycle states and exports are modeled", () => {
  const types = read("features/vayon/campaign-studio/types.ts"),
    service = read("features/vayon/campaign-studio/service.ts");
  for (const value of [
    "Brand Designer",
    "Graphic Designer",
    "Presentation Designer",
    "Copywriter",
    "Motion Designer",
    "Video Producer",
    "Social Media Manager",
    "Advertising Specialist",
    "Landing Page Designer",
    "Email Marketing Specialist",
    "Draft",
    "Review",
    "Approved",
    "Scheduled",
    "Published",
    "Archived",
    "Campaign ZIP",
    "Creative Package",
    "Brand Package",
    "Presentation Package",
    "Marketing Package",
  ])
    assert.ok(`${types}${service}`.includes(value), value);
});
