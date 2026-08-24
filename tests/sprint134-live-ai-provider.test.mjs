import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("OpenAI document adapter implements the unchanged runtime adapter", () => {
  const source = read(
    "features/vayon/creative-providers/openai-document.adapter.ts",
  );
  for (const method of [
    "generate",
    "edit",
    "translate",
    "export",
    "validate",
    "health",
    "estimate",
    "stream",
  ])
    assert.match(source, new RegExp(`${method}\\(`));
  assert.match(source, /OpenAIProvider/);
  assert.doesNotMatch(source, /images\.generate|video/i);
});
test("provider registration composes the existing execution engine", () => {
  const source = read("features/vayon/creative-providers/execution.factory.ts");
  assert.match(source, /RuntimeAdapterRegistry/);
  assert.match(source, /registry\.register\(new OpenAIDocumentAdapter\(\)\)/);
  assert.match(source, /new CreativeExecutionService/);
});
test("Document Studio routes all generation through the execution composition root", () => {
  const source = read("features/vayon/document-studio/actions.ts");
  assert.match(source, /createLiveCreativeExecutionService\(\)\.accept/);
  assert.doesNotMatch(source, /new OpenAI|responses\.create|fetch\(/);
});
test("prompt assembly includes tenant brand campaign and factual safety", () => {
  const source = read("features/vayon/document-studio/prompt-builder.ts");
  for (const value of [
    "Workspace",
    "Campaign",
    "Brand voice",
    "Brand colours",
    "Typography references",
    "Mission",
    "Vision",
    "CTA style",
    "Legal footer",
    "do not invent",
  ])
    assert.match(source, new RegExp(value, "i"));
});
test("streaming quality review observability and documentation are registered", () => {
  const route = read("app/api/creative/documents/stream/route.ts"),
    review = read("features/vayon/document-studio/quality-review.ts"),
    docs = read("LIVE_AI_PROVIDER_INTEGRATION.md");
  for (const stage of [
    "Planning",
    "Writing",
    "Brand Review",
    "Formatting",
    "Completed",
  ])
    assert.match(`${route}\n${docs}`, new RegExp(stage));
  for (const value of [
    "requiredSections",
    "brandConsistency",
    "missingInformation",
    "toneConsistency",
    "formattingCompleteness",
  ])
    assert.match(review, new RegExp(value));
  assert.match(docs, /token usage/i);
});
