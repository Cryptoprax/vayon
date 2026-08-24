import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Creative Cloud reuses licensed Creative Studio without changing engines", () => {
  const service = read("features/vayon/creative-cloud/service.ts"),
    page = read("app/vayon/creative/cloud/page.tsx");
  assert.match(service, /CreativeStudioService\.production/);
  assert.match(page, /CreativeCloudService\.production/);
  assert.doesNotMatch(service, /createClient|fetch\(|service_role/i);
});
test("all fifteen studios declare permanent operating contracts", () => {
  const catalog = read("features/vayon/creative-cloud/catalog.ts"),
    types = read("features/vayon/creative-cloud/types.ts");
  for (const value of [
    "Brand Studio",
    "Campaign Studio",
    "Image Studio",
    "Video Studio",
    "Document Studio",
    "Presentation Studio",
    "Website Studio",
    "Social Studio",
    "Email Studio",
    "Advertising Studio",
    "Template Marketplace",
    "Asset Library",
    "Creative Runtime",
    "Creative Pipelines",
    "Creative Director",
    "inputs",
    "outputs",
    "supportedAssets",
    "pipelineDependencies",
    "brandDependencies",
    "approvalFlow",
    "permissionRequirements",
    "exportFormats",
    "providerRequirements",
  ])
    assert.ok(`${catalog}${types}`.includes(value), value);
});
test("AI department hierarchy contains every director and specialist group", () => {
  const catalog = read("features/vayon/creative-cloud/catalog.ts");
  for (const value of [
    "Creative Director",
    "Brand Director",
    "Image Director",
    "Video Director",
    "Document Director",
    "Presentation Director",
    "Website Director",
    "Social Director",
    "Advertising Director",
    "Publishing Director",
    "Brand Strategist",
    "Product Photographer",
    "Storyboard Artist",
    "Technical Writer",
    "Data Visualizer",
    "Accessibility Specialist",
    "Community Manager",
    "Campaign Optimizer",
  ])
    assert.ok(catalog.includes(value), value);
});
test("memory graph prompt approvals cost and roadmap are architecture only", () => {
  const types = read("features/vayon/creative-cloud/types.ts"),
    service = read("features/vayon/creative-cloud/service.ts");
  for (const value of [
    "sharedBrandMemory",
    "campaignMemory",
    "creativeMemory",
    "promptMemory",
    "approvalMemory",
    "assetRelationships",
    "versionRelationships",
    "businessGoal",
    "Founder Approval",
    "estimatedCost",
    "providerCost",
    "tokenCost",
    "generationCost",
    "exportCost",
    "budgetAllocation",
    "billingIntegrated: false",
    "not_implemented",
    "Autonomous Creative Director",
  ])
    assert.ok(`${types}${service}`.includes(value), value);
  assert.doesNotMatch(
    `${types}${service}`,
    /fetch\(|generateImage|generateVideo|generateDocument/i,
  );
});
