import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Brand Studio reuses existing licensed Creative Studio and Brand Kits", () => {
  const service = read("features/vayon/brand-studio/service.ts");
  assert.match(service, /CreativeStudioService\.production/);
  assert.match(service, /source\.brandKits/);
  assert.doesNotMatch(service, /createClient|fetch\(|service_role/i);
});
test("Brand wizard covers all seven identity decisions", () => {
  const ui = read("features/vayon/brand-studio/BrandStudio.tsx");
  for (const value of [
    "Company Profile",
    "Business Type",
    "Target Audience",
    "Brand Personality",
    "Colour Strategy",
    "Logo Preferences",
    "Photography Style",
    "Let AI Recommend",
    "Choose manually",
  ])
    assert.ok(ui.includes(value), value);
});
test("brand intelligence and consistency remain deterministic and provider free", () => {
  const types = read("features/vayon/brand-studio/types.ts"),
    engine = read("features/vayon/brand-studio/consistency.engine.ts"),
    service = read("features/vayon/brand-studio/service.ts");
  for (const value of [
    "mission",
    "vision",
    "toneOfVoice",
    "writingStyle",
    "illustrationStyle",
    "motionStyle",
    "legalDisclaimers",
    "dos",
    "donts",
  ])
    assert.ok(types.includes(value), value);
  assert.match(engine, /score:\s*Math\.max/);
  assert.match(service, /providerConnected:false/);
});
test("all future creative modules resolve a central brand default contract", () => {
  const defaults = read("features/vayon/brand-studio/brand-defaults.ts");
  for (const value of [
    "Marketing Studio",
    "Presentation Studio",
    "Video Studio",
    "Website Studio",
    "Image Studio",
    "resolveCreativeBrandDefaults",
  ])
    assert.ok(defaults.includes(value), value);
});
