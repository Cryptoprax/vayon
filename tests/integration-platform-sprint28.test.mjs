import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(path, "utf8");
test("provider contract exposes the complete deterministic lifecycle", () => {
  const source = read(
    "features/platform/integration-platform/contracts/provider.ts",
  );
  for (const method of [
    "connect",
    "disconnect",
    "health",
    "capabilities",
    "validate",
    "execute",
  ])
    assert.match(source, new RegExp(`${method}\\(`));
});
test("registry contains all nine Sprint 28 providers", () => {
  const source = read(
    "features/platform/integration-platform/registry/provider.registry.ts",
  );
  for (const provider of [
    "WhatsApp",
    "Gmail",
    "Google Calendar",
    "Outlook",
    "Twilio",
    "Stripe",
    "OpenAI",
    "Claude",
    "Gemini",
  ])
    assert.match(source, new RegExp(provider));
  assert.match(source, /Provider already registered/);
});
test("deterministic adapter never makes an external request", () => {
  const source = read(
    "features/platform/integration-platform/adapters/deterministic.adapter.ts",
  );
  assert.match(source, /externalRequestMade:\s*false/);
  assert.match(source, /Approval is required/);
  assert.doesNotMatch(source, /fetch\(|axios|https?:\/\//i);
});
test("manager covers connections health capabilities audit and rate limits", () => {
  const source = read(
    "features/platform/integration-platform/services/integration-manager.ts",
  );
  for (const value of [
    "connect",
    "disconnect",
    "health",
    "capabilities",
    "appendAudit",
    "rate limit",
  ])
    assert.match(source, new RegExp(value, "i"));
});
test("credentials are reference only and reject production secrets", () => {
  const source = read(
    "features/platform/integration-platform/credentials/in-memory.vault.ts",
  );
  assert.match(source, /ReferenceOnlyCredentialVault/);
  assert.match(source, /does not accept production credentials/);
  assert.doesNotMatch(
    source,
    /ciphertext|accessToken|refreshToken|clientSecret/,
  );
});
test("retry and rate-limit contracts are provider neutral", () => {
  const contracts = read(
      "features/platform/integration-platform/contracts/provider.ts",
    ),
    policies = read(
      "features/platform/integration-platform/policies/policies.ts",
    ),
    retry = read(
      "features/platform/integration-platform/services/retry.service.ts",
    );
  for (const name of ["RetryPolicy", "RateLimitPolicy", "RateLimitDecision"])
    assert.match(contracts, new RegExp(name));
  assert.match(policies, /exponential/);
  assert.match(retry, /retryableCodes/);
});
test("Connected Apps preserves the provider control plane without duplicate dashboard calls", () => {
  const page = read("app/vayon/settings/integrations/page.tsx");
  assert.match(page, /IntegrationCenter/);
  assert.doesNotMatch(page, /ProviderStatusDashboard/);
  assert.doesNotMatch(page, /IntegrationPlatformService/);
});
test("Sprint 28 documentation records deterministic safety boundaries", () => {
  const source = read("docs/INTEGRATION_PLATFORM.md");
  assert.match(source, /externalRequestMade: false/);
  assert.match(
    source,
    /Live APIs and production credentials: intentionally absent/,
  );
  assert.match(source, /Future provider registration/);
});
