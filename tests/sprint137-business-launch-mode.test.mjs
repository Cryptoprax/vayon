import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(path, "utf8");
test("business launch route composes the existing onboarding service and permission engine", () => {
  const route = read("app/onboarding/business-launch/page.tsx"),
    service = read("features/onboarding/business-launch/service.ts"),
    actions = read("features/onboarding/business-launch/actions.ts");
  assert.match(route, /BusinessLaunchService/);
  assert.match(service, /EnterpriseOnboardingService/);
  assert.match(
    actions,
    /requireWorkspacePermission\("creative_studio", "create"\)/,
  );
  assert.match(actions, /onboarding\.save/);
  assert.doesNotMatch(actions, /\.from\(/);
});
test("wizard implements all six launch steps and requested catalogs", () => {
  const ui = read(
      "features/onboarding/business-launch/BusinessLaunchWizard.tsx",
    ),
    types = read("features/onboarding/business-launch/types.ts");
  for (const value of [
    "Business name",
    "Industry",
    "Country",
    "Primary language",
    "Website \\(optional\\)",
    "Execution preview",
    "Estimated time",
    "Generated assets",
    "Required approvals",
    "Business readiness",
    "Creative readiness",
  ])
    assert.match(ui, new RegExp(value, "i"));
  for (const value of [
    "Startup",
    "Agency",
    "Real Estate",
    "Solar",
    "Healthcare",
    "Hotel",
    "Restaurant",
    "Construction",
    "Manufacturing",
    "Software",
    "Education",
    "Retail",
    "Generate Leads",
    "Increase Sales",
    "Brand Awareness",
    "Investor Ready",
    "Recruit Employees",
    "Launch Product",
    "Expand Internationally",
    "B2B",
    "B2C",
    "Government",
    "Residential",
    "Commercial",
    "Industrial",
    "Investors",
    "Partners",
    "Brand Identity",
    "CRM Workspace",
    "AI Workforce",
    "Company Profile",
    "Brochure",
    "Pitch Deck",
    "Website",
    "Landing Page",
    "Marketing Campaign",
    "Product Images",
    "Promotional Video",
    "Social Media Starter Pack",
    "Email Templates",
    "Sales Proposal",
  ])
    assert.match(types, new RegExp(`"${value}"`));
});
test("orchestrator delegates every output to an existing authoritative module", () => {
  const source = read("features/onboarding/business-launch/orchestrator.ts");
  for (const owner of [
    "Brand Studio",
    "CRM",
    "AI Workforce",
    "Document Studio",
    "Creative Cloud",
    "Campaign Studio",
    "Image Studio",
    "Video Studio",
  ])
    assert.match(source, new RegExp(`"${owner}"`));
  assert.match(source, /WaitingProvider/);
  assert.match(source, /Waiting Approval/);
});
test("launch project is resumable tenant-scoped and never calls generation directly", () => {
  const actions = read("features/onboarding/business-launch/actions.ts"),
    types = read("features/onboarding/business-launch/types.ts");
  for (const field of [
    "items",
    "readiness",
    "estimatedMinutes",
    "warnings",
    "errors",
  ])
    assert.match(types, new RegExp(field));
  assert.match(actions, /session\?\.configuration/);
  assert.match(actions, /previousId/);
  assert.doesNotMatch(
    actions,
    /generateVideo|generateImage|generateDocument|provider\.generate/,
  );
});
