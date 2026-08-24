import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Creative Runtime route is Founder protected", () => {
  const page = read("app/vayon/creative/runtime/page.tsx"),
    service = read("features/vayon/creative-runtime/service.ts");
  assert.match(page, /FounderAccessError/);
  assert.match(service, /founderContext\(\)/);
  assert.doesNotMatch(service, /createClient|service_role/i);
});
test("provider registry declares complete provider descriptors with no availability", () => {
  const types = read("features/vayon/creative-runtime/types.ts"),
    registry = read("features/vayon/creative-runtime/registry.ts");
  for (const value of [
    "providerType",
    "supportedCapabilities",
    "qualityTier",
    "speedTier",
    "costTier",
    "maxResolution",
    "supportedAspectRatios",
    "supportsEditing",
    "supportsGeneration",
    "supportsVideo",
    "supportsVector",
    "supportsTransparency",
    "supportsUpscaling",
    "supportsBackgroundRemoval",
    "supportsInpainting",
    "supportsOutpainting",
    "supportsLogoGeneration",
    "supportsMockups",
    "supportsTextReplacement",
  ])
    assert.ok(types.includes(value), value);
  assert.doesNotMatch(registry, /status:\s*"Available"/);
});
test("router is deterministic and fails closed without providers", () => {
  const router = read("features/vayon/creative-runtime/router.ts");
  assert.match(router, /forCapability/);
  assert.match(router, /fallbackChain/);
  assert.match(router, /state:\s*selected\s*\?\s*"routed"\s*:\s*"unavailable"/);
  assert.match(router, /failed closed/);
  assert.doesNotMatch(router, /fetch\(|openai|adobe|google|stability/i);
});
test("adapter job output quality and capability contracts are complete", () => {
  const all = ["adapter.ts", "types.ts", "review.ts", "capabilities.ts"]
    .map((file) => read(`features/vayon/creative-runtime/${file}`))
    .join("\n");
  for (const value of [
    "generate(",
    "edit(",
    "upscale(",
    "removeBackground(",
    "replaceBackground(",
    "createVariations(",
    "inpaint(",
    "outpaint(",
    "createLogo(",
    "createMockup(",
    "Queued",
    "Running",
    "Completed",
    "Failed",
    "Cancelled",
    "WaitingApproval",
    "correlationId",
    "automatedJudgement: false",
    "CanGenerateImages",
    "CanEditImages",
    "CanGenerateVideo",
    "CanCreateLogos",
    "CanUpscale",
    "CanRemoveBackground",
  ])
    assert.ok(all.includes(value), value);
});
