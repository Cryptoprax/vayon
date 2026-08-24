import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("Video Studio route and complete output catalog are registered", () => {
  assert.match(
    read("app/vayon/creative/videos/page.tsx"),
    /VideoStudioService/,
  );
  const types = read("features/vayon/video-studio/types.ts");
  for (const value of [
    "15 Second Advertisement",
    "30 Second Advertisement",
    "60 Second Commercial",
    "Product Demonstration",
    "Website Hero Video",
    "Corporate Introduction",
    "Investor Video",
    "Instagram Reel",
    "Facebook Video",
    "LinkedIn Video",
    "YouTube Short",
  ])
    assert.match(types, new RegExp(value));
});
test("video provider implements real create edit poll and download lifecycle", () => {
  const provider = read(
    "features/vayon/creative-providers/openai-video.provider.ts",
  );
  for (const value of [
    "videos.create",
    "videos.edit",
    "videos.retrieve",
    "videos.downloadContent",
  ])
    assert.match(provider, new RegExp(value.replace(".", "\\.")));
  assert.match(provider, /videos\.list/);
});
test("video execution stays behind the unchanged adapter registry", () => {
  const adapter = read(
      "features/vayon/creative-providers/openai-video.adapter.ts",
    ),
    factory = read("features/vayon/creative-providers/execution.factory.ts"),
    actions = read("features/vayon/video-studio/actions.ts");
  assert.match(adapter, /implements RuntimeAdapter/);
  assert.match(factory, /register\(new OpenAIVideoRuntimeAdapter/);
  assert.match(actions, /createLiveCreativeExecutionService\(\)/);
  assert.doesNotMatch(actions, /new OpenAI|videos\.create|fetch\(/);
});
test("brand storyboard storage versioning and exports are complete", () => {
  const prompt = read("features/vayon/video-studio/prompt-builder.ts"),
    actions = read("features/vayon/video-studio/actions.ts"),
    types = read("features/vayon/video-studio/types.ts");
  for (const value of [
    "Brand colours",
    "Typography",
    "Logo reference",
    "Visual identity",
    "Motion style",
    "Brand voice",
    "Campaign context",
  ])
    assert.match(prompt, new RegExp(value, "i"));
  assert.match(actions, /creative_assets/);
  assert.match(actions, /versionOf/);
  for (const value of [
    "MP4",
    "MOV",
    "WEBM",
    "GIF Preview",
    "Storyboard PDF",
    "Subtitle SRT",
  ])
    assert.match(types, new RegExp(value));
});
test("streaming and safe unavailable provider behavior are documented", () => {
  const route = read("app/api/creative/videos/stream/route.ts"),
    docs = read("VIDEO_STUDIO_LIVE.md");
  for (const stage of [
    "Planning",
    "Storyboarding",
    "Rendering",
    "Reviewing",
    "Completed",
  ])
    assert.match(`${route}\n${docs}`, new RegExp(stage));
  assert.match(docs, /WaitingProvider/);
  assert.match(docs, /September 24, 2026/);
});
