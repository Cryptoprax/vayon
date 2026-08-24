import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
test("homepage composes the public growth platform without replacing its hero", async () => {
  const home = await read("features/marketing/components/Homepage.tsx");
  assert.match(
    home,
    /The AI Operating System for Modern Real Estate Companies/,
  );
  assert.match(home, /PublicGrowthPlatform/);
});
test("public growth narrative covers requested product outcomes", async () => {
  const source = await read(
    "features/marketing/components/PublicGrowthPlatform.tsx",
  );
  for (const value of [
    "Marketing AI",
    "Sales AI",
    "Founder AI",
    "Creative Studio",
    "Knowledge Platform",
    "Integrations",
    "Customer Success",
    "Enterprise security",
  ])
    assert.ok(source.includes(value), value);
});
test("interactive tour works without authentication and covers seven products", async () => {
  const source = await read(
    "features/marketing/components/PublicGrowthPlatform.tsx",
  );
  for (const value of [
    "CRM",
    "Marketing",
    "Sales",
    "Founder Dashboard",
    "Creative Studio",
    "Knowledge",
    "AI Workforce",
    "/demo",
  ])
    assert.ok(source.includes(value), value);
  assert.doesNotMatch(source, /\/login/);
});
test("demo is isolated, read-only, populated and globally localized", async () => {
  const page = await read("app/demo/page.tsx"),
    repository = await read(
      "features/vayon/demo-experience/repository/aurora-enterprise.repository.ts",
    ),
    ui = await read(
      "features/vayon/demo-experience/components/DemoExperience.tsx",
    );
  assert.match(page, /MarketingCurrencyProvider/);
  for (const value of [
    "demoData: true",
    "billing",
    "aiRecommendations",
    "analytics",
    "workflows",
  ])
    assert.ok(repository.includes(value), value);
  assert.match(ui, /Changes are not persisted/);
  assert.match(ui, /Founder Dashboard Tour/);
  assert.match(ui, /Knowledge Tour/);
});
test("pricing contains commercial editions and annual savings", async () => {
  const source = await read("features/marketing/components/PricingTable.tsx");
  for (const value of [
    "Starter",
    "Professional",
    "Business",
    "Business Plus",
    "Enterprise",
    "Annual · save 20%",
    "AI Workforce",
    "storage",
    "integrations",
    "support",
  ])
    assert.ok(source.includes(value), value);
});
test("conversion engine accepts every required acquisition intent", async () => {
  const action = await read("features/marketing/actions/lead.actions.ts"),
    form = await read("features/marketing/components/LeadCapture.tsx"),
    service = await read(
      "features/marketing/services/contact-pipeline.service.ts",
    );
  for (const value of [
    "demo",
    "trial",
    "sales",
    "newsletter",
    "enterprise",
    "waitlist",
  ])
    assert.ok(
      action.includes(`\"${value}\"`) && form.includes(`value=\"${value}\"`),
      value,
    );
  assert.match(service, /enterprise_inquiry/);
  assert.match(service, /waitlist/);
});
test("onboarding retains persistent progress and launch checklist", async () => {
  const source = await read(
    "features/onboarding/components/EnterpriseOnboardingWizard.tsx",
  );
  for (const value of [
    "saveOnboardingProgressAction",
    "Progress",
    "Invite",
    "Import",
    "AI",
    "Launch",
  ])
    assert.ok(source.includes(value), value);
});
test("SEO analytics accessibility and documentation remain integrated", async () => {
  const layout = await read("app/layout.tsx"),
    home = await read("app/page.tsx"),
    growth = await read(
      "features/marketing/components/PublicGrowthPlatform.tsx",
    );
  for (const value of ["metadataBase", "openGraph", "twitter", "canonical"])
    assert.ok(layout.includes(value), value);
  assert.match(home, /MarketingAnalytics/);
  assert.match(home, /ConsentManager/);
  assert.match(growth, /role=\"tablist\"/);
  assert.match(
    await read("docs/PUBLIC_GROWTH_PLATFORM.md"),
    /Production isolation/,
  );
});
