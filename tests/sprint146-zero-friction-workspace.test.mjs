import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const proxy = read("lib/supabase/proxy.ts");
const callback = read("app/auth/callback/route.ts");
const shell = read("features/vayon/components/VayonShell.tsx");
const setup = read("features/onboarding/components/WorkspaceSetupCenter.tsx");
const wizard = read(
  "features/onboarding/components/EnterpriseOnboardingWizard.tsx",
);

test("authenticated users enter a workspace-safe VAYON destination", () => {
  assert.doesNotMatch(proxy, /target\.pathname = "\/onboarding"/);
  assert.match(read("app/vayon/page.tsx"), /if \(!workspace\) redirect\("\/onboarding"\)/);
  assert.match(read("app/vayon/page.tsx"), /\/vayon\/dashboard/);
  assert.doesNotMatch(callback, /destination=.*onboarding|membership\?/);
  assert.match(callback, /safeAuthenticatedPath\(next\)/);
});

test("zero-friction bootstrap preserves owner-scoped atomic provisioning", () => {
  const service = read(
    "features/onboarding/services/workspace-bootstrap.service.ts",
  );
  const onboarding = read("features/onboarding/services/onboarding.service.ts");
  assert.match(shell, /WorkspaceBootstrapService/);
  assert.match(service, /OnboardingService\(\)\.provision/);
  assert.match(onboarding, /complete_sprint43_onboarding/);
  assert.match(onboarding, /async provision/);
  assert.doesNotMatch(service, /complete_enterprise_onboarding/);
});

test("dashboard setup center is dynamic, clickable, and non-blocking", () => {
  for (const label of [
    "Workspace Setup",
    "Company created",
    "Connect Gmail",
    "Connect Google Calendar",
    "Connect WhatsApp",
    "Configure AI Workforce",
    "Import CRM",
    "Import Properties",
    "Choose Subscription",
    "Configure Notifications",
    "Configure Email",
    "Launch Workspace",
    "Recommended next action",
    "Estimated time",
    "Configure",
    "Later",
  ])
    assert.match(setup, new RegExp(label));
  assert.match(setup, /completed_steps/);
  assert.match(setup, /health/);
  assert.match(read("app/vayon/home/page.tsx"), /AdaptiveWorkspace/);
  assert.match(read("app/vayon/home/page.tsx"), /WorkspaceSetupCenter/);
});

test("existing onboarding is targetable without numbered UX", () => {
  const route =
    read("app/onboarding/page.tsx") +
    read("features/onboarding/domain/enterprise-onboarding.ts");
  const compact = read("features/onboarding/components/OnboardingWizard.tsx");
  const progress = read("features/onboarding/components/ProgressStepper.tsx");
  const launch = read(
    "features/onboarding/business-launch/BusinessLaunchWizard.tsx",
  );
  for (const target of [
    "branding",
    "gmail",
    "calendar",
    "whatsapp",
    "ai-workforce",
    "crm",
    "properties",
    "subscription",
  ])
    assert.match(route, new RegExp(target));
  assert.doesNotMatch(wizard + compact + launch, /Step \{/);
  assert.doesNotMatch(progress, />\{complete\?<Check[^:]+:number\}</);
  assert.match(read("app/onboarding/[setup]/page.tsx"), /onboardingSetupTargets/);
});

test("contextual AI setup and automatic regional defaults are present", () => {
  const state = read(
    "features/onboarding/components/ContextualSetupState.tsx",
  );
  const workforce = read("app/vayon/ai/workforce/page.tsx");
  const bootstrap = read(
    "features/onboarding/services/workspace-bootstrap.service.ts",
  );
  for (const value of [
    "Meet Your AI Team",
    "45 seconds",
    "Configure AI Workforce",
    "Later",
  ])
    assert.match(state + workforce, new RegExp(value));
  for (const value of [
    "accept-language",
    "x-vercel-ip-country",
    "x-vercel-ip-timezone",
    "currency",
    "language",
  ])
    assert.match(bootstrap + wizard, new RegExp(value));
});
