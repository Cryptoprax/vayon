import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("production-ready capabilities are present in primary navigation", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  for (const value of [
    "Marketing Studio",
    "Growth Studio",
    "VAYON Intelligence",
    "Knowledge",
    "Product Intelligence",
  ]) assert.match(navigation, new RegExp(value));
  for (const route of [
    "/vayon/creative-studio",
    "/vayon/creative-studio/growth",
    "/vayon/intelligence",
    "/vayon/knowledge",
    "/vayon/settings/product-intelligence",
  ]) assert.match(navigation, new RegExp(route.replaceAll("/", "\\/")));
});

test("unfinished capabilities remain unexposed", () => {
  const navigation = read("features/vayon/product-shell/navigation.ts");
  for (const value of ["Referral Program", "Affiliate Program", "Future Publishing", "Autonomous AI"])
    assert.doesNotMatch(navigation, new RegExp(value));
});

test("Intelligence is lazy loaded and enabled by default with an explicit kill switch", () => {
  const shell = read("features/vayon/components/VayonShell.tsx");
  const experience = read("features/vayon/components/ProductExperience.tsx");
  const env = read("config/environments/production.env.example");
  assert.match(shell, /FEATURE_VAYON_INTELLIGENCE !== "false"/);
  assert.match(experience, /dynamic\(/);
  assert.match(experience, /ssr: false/);
  assert.match(env, /FEATURE_VAYON_INTELLIGENCE=true/);
});

test("Marketing Studio preserves subscription licensing", () => {
  const access = read("features/vayon/creative-studio/access.service.ts");
  const page = read("app/vayon/creative-studio/page.tsx");
  assert.match(access, /FeatureLicensingService/);
  assert.match(access, /marketing_studio/);
  assert.match(access, /workspace_members/);
  assert.match(page, /notFound/);
});

test("demo exposes activated experiences without production integrations", () => {
  const demo = read("features/vayon/demo-experience/components/DemoExperience.tsx");
  for (const value of ['"marketing"', '"growth"', '"landing-pages"', '"assistant"'])
    assert.match(demo, new RegExp(value));
  assert.match(demo, /Read-only demo/);
  assert.match(demo, /Seeded, isolated fixtures/);
});

test("activation report classifies production and future capabilities", () => {
  const report = read("docs/FEATURE_ACTIVATION_REPORT.md");
  for (const value of ["Production ready and activated", "Internal only", "Incomplete or future", "Video rendering", "Referral and affiliate"])
    assert.match(report, new RegExp(value));
});
