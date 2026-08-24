import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("image adapter reuses runtime and existing OpenAI provider", () => {
  const adapter = read(
      "features/vayon/creative-providers/openai-image.adapter.ts",
    ),
    factory = read("features/vayon/creative-providers/execution.factory.ts");
  assert.match(adapter, /implements RuntimeAdapter/);
  assert.match(adapter, /OpenAICreativeImageProvider/);
  assert.match(
    factory,
    /registry\.register\(new OpenAIImageRuntimeAdapter\(\)\)/,
  );
});
test("Image Studio actions never call providers directly", () => {
  const source = read("features/vayon/image-studio/actions.ts");
  assert.match(source, /createLiveCreativeExecutionService\(\)\.accept/);
  assert.match(source, /requireWorkspacePermission/);
  assert.doesNotMatch(source, /new OpenAI|images\.generate|fetch\(/);
});
test("brand prompt and requested image categories are complete", () => {
  const prompt = read("features/vayon/image-studio/prompt-builder.ts"),
    types = read("features/vayon/image-studio/types.ts");
  for (const value of [
    "Brand colours",
    "Logo reference",
    "Typography guidance",
    "Campaign context",
    "Visual identity",
  ])
    assert.match(prompt, new RegExp(value, "i"));
  for (const value of [
    "Product Image",
    "Hero Image",
    "Lifestyle Image",
    "Architecture",
    "Interior",
    "Team Photo",
    "Office Image",
    "Product Mockup",
    "Background",
    "Marketing Image",
  ])
    assert.match(types, new RegExp(value));
});
test("generated images are tenant stored and registered as draft assets", () => {
  const adapter = read(
      "features/vayon/creative-providers/openai-image.adapter.ts",
    ),
    action = read("features/vayon/image-studio/actions.ts");
  assert.match(adapter, /organizationId.*workspaceId.*creative-assets/s);
  assert.match(adapter, /vayon-assets/);
  assert.match(action, /creative_assets/);
  assert.match(action, /status:\s*"draft"/);
});
test("editing streaming and documentation remain governed", () => {
  const provider = read(
      "features/vayon/creative-studio/generation.provider.ts",
    ),
    route = read("app/api/creative/images/stream/route.ts"),
    docs = read("IMAGE_STUDIO_LIVE.md");
  assert.match(provider, /images\.edit/);
  for (const stage of ["Planning", "Generating", "Reviewing", "Completed"])
    assert.match(`${route}\n${docs}`, new RegExp(stage));
  assert.match(docs, /WaitingProvider/);
});
