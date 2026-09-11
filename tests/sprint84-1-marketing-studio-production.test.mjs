import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");

test("Marketing Studio no longer depends on the Creative Studio beta flag", () => {
  const flags = read("lib/infrastructure/feature-flags.ts");
  const env = read(".env.example");
  const access = read("features/vayon/creative-studio/access.service.ts");
  assert.doesNotMatch(flags + env, /FEATURE_CREATIVE_STUDIO_BETA|creative_studio_beta/);
  assert.doesNotMatch(access, /creative_studio_beta|EnvironmentFeatureFlagProvider/);
  assert.match(access, /FeatureLicensingService/);
  assert.match(access, /licensed\("marketing_studio"\)/);
  assert.match(access, /workspace_members/);
});

test("Marketing is available in authenticated primary navigation", () => {
  const navigation = read("features/platform/builder/config/vayon-navigation.ts");
  assert.match(navigation, /label: "Marketing"/);
  assert.match(navigation, /href: "\/vayon\/creative"/);
  assert.match(navigation, /featureId: "marketing_studio"/);
});

test("Marketing UI is production labeled while AI video remains Preview", () => {
  const ui = read("features/vayon/creative-studio/components/StudioViews.tsx") + read("features/vayon/creative-studio/components/GrowthViews.tsx");
  assert.match(ui, /Marketing Studio/);
  assert.doesNotMatch(ui, /Creative Studio[^\n]*Beta|\(Beta\)|in this beta/i);
  assert.match(ui, /AI Video[^\n]*Preview/i);
});

test("provider failures are sanitized and leave editing available", () => {
  const action = read("features/vayon/creative-studio/actions.ts");
  const page = read("app/vayon/creative-studio/assistant/page.tsx");
  for (const value of ["temporarily unavailable", "existing drafts", "templates", "Brand Kit", "Asset Library", "editor"]) assert.match(action + page, new RegExp(value, "i"));
  assert.match(page, /diagnosticMessages/);
  assert.match(page, /billing_required/);
  assert.doesNotMatch(page, /OPENAI_API_KEY|api[_-]?key/i);
});

test("production entitlement migration preserves existing licensed workspaces", () => {
  const migration = read("supabase/migrations/20260915000000_sprint84_1_marketing_studio_production.sql");
  assert.match(migration, /insert into public\.workspace_feature_licenses/);
  assert.match(migration, /on conflict \(workspace_id, feature\) do update/);
  assert.match(migration, /'marketing_studio'/);
  assert.match(migration, /delete from public\.workspace_feature_licenses where feature = 'creative_studio_beta'/);
});
