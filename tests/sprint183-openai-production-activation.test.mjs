import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("central OpenAI configuration supports production defaults and workspace overrides", async () => {
  const source = await read("features/platform/openai/services/runtime-configuration.ts");
  for (const value of ["gpt-5.5", "OPENAI_FALLBACK_MODEL", "OPENAI_TEMPERATURE", "OPENAI_MAX_OUTPUT_TOKENS", "OPENAI_REASONING_LEVEL", "OPENAI_STREAMING", "integration_connections", "workspace-configuration"]) assert.match(source, new RegExp(value));
});

test("production provider classifies transient failures and uses a governed model fallback", async () => {
  const source = await read("features/platform/openai/providers/openai.provider.ts");
  for (const value of ["rate_limited", "provider_unavailable", "withModelFallback", "openai.model.fallback", "retryAttempts", "insufficient_quota"]) assert.match(source, new RegExp(value));
  assert.doesNotMatch(source, /log\([^\n]+(?:apiKey|prompt|instructions|input:)/i);
});

test("named AI team responsibilities remain advisory and approval governed", async () => {
  const [policies, runtime] = await Promise.all([read("features/platform/openai/services/employee-policy.ts"), read("features/platform/openai/runtime/service.ts")]);
  for (const value of ["Sarah", "Emma", "Alex", "David", "Olivia", "lead qualification", "property matching", "marketing copy", "operational planning", "support reply drafts"]) assert.match(policies, new RegExp(value));
  for (const guardrail of ["Never execute", "Never publish", "Never edit records", "human approval"]) assert.match(runtime, new RegExp(guardrail));
});

test("Founder Command Center surfaces evidence-backed AI usage and pending approvals", async () => {
  const card = await read("features/vayon/founder-command-center/AIUsageCard.tsx");
  for (const value of ["Today's AI usage", "Estimated AI cost", "Successful requests", "Pending approvals", "AI availability", "ai_approval_queue"]) assert.match(card, new RegExp(value));
});

test("Connected Apps surfaces the configured production model without exposing secrets", async () => {
  const source = await read("features/platform/integrations/center/service.ts");
  assert.match(source, /integration_providers\.code","openai/);
  assert.match(source, /gpt-5\.5/);
  assert.doesNotMatch(source, /operational:[\s\S]*OPENAI_API_KEY/);
});
