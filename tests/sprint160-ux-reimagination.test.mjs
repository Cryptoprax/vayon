import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const onboarding = read("features/onboarding/components/EnterpriseOnboardingWizard.tsx");

test("onboarding is a four-screen choice-driven experience", () => {
  for (const copy of ["Choose your business", "What should VAYON do first?", "Connect your everyday tools", "Meet your AI Team"])
    assert.match(onboarding, new RegExp(copy.replace(/[?]/g, "\\?")));
  assert.match(onboarding, /\{step\} of 4/);
  for (const business of ["Real Estate", "Marketing Agency", "Consulting", "Construction", "Healthcare", "Education", "Retail", "Other"])
    assert.match(onboarding, new RegExp(business));
});

test("onboarding infers locale and removes technical configuration", () => {
  assert.match(onboarding, /navigator\.language/);
  assert.match(onboarding, /resolvedOptions\(\)\.timeZone/);
  assert.doesNotMatch(onboarding, /Preferred provider|Default model|Template names|Email addresses \(comma separated\)/);
});

test("billing and workflows progressively disclose advanced controls", () => {
  const billing = read("app/vayon/settings/billing/page.tsx");
  const workflows = read("app/vayon/workflows/page.tsx");
  assert.match(billing, /hasBillingAccount &&/);
  assert.match(billing, /<details/);
  assert.match(workflows, /Advanced workflow settings/);
  assert.match(workflows, /<details/);
});

test("AI employee entry point uses customer language", () => {
  const workforce = read("app/vayon/ai/employees/page.tsx");
  assert.doesNotMatch(workforce, /GPT workforce|model name|token|context window/i);
  assert.match(workforce, /Meet Your AI Team/);
  assert.match(workforce, /AI real estate specialists are prepared/);
});
