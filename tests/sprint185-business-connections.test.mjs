import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("Business Connections audit passes", () => {
  const result = spawnSync(process.execPath, ["scripts/audit-business-connections.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("Founder navigation and loading experience use the executive name", () => {
  assert.match(read("features/platform/founder/components/FounderDashboard.tsx"), /Business Connections/);
  assert.match(read("app/platform/founder/integrations/loading.tsx"), /Loading Business Connections/);
});

test("provider actions resolve to existing connected apps architecture", () => {
  const source = read("features/platform/enterprise-integrations/components/BusinessConnectionsDirectory.tsx");
  for (const provider of ["google","gmail","calendar","whatsapp","openai","paddle","razorpay","email"])
    assert.match(source, new RegExp(`provider[:=]\\?\\$?\\{?${provider}|provider:\"${provider}\"`));
  assert.match(source, /\/vayon\/crm\?import=1/);
  assert.match(source, /tab=marketplace/);
});

test("the Founder projection does not duplicate provider health calls", () => {
  const source = read("features/platform/enterprise-integrations/services/enterprise-integration.service.ts");
  assert.match(source, /service\.dashboard\(\)/);
  assert.doesNotMatch(source, /adapter\.health|new IntegrationProviderRegistry/);
});

test("cards expose deterministic recommendations, confidence, and lazy rendering", () => {
  const source = read("features/platform/enterprise-integrations/components/BusinessConnectionsDirectory.tsx");
  for (const value of ["Recommendation", "Confidence", "generatedAt", "content-visibility:auto", "contain-intrinsic-size"])
    assert.match(source, new RegExp(value));
  assert.doesNotMatch(source, /Date\.now\(\)/);
});
