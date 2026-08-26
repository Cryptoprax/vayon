import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("critical verification journey points to automatic workspace and dashboard continuation", () => {
  const verification = read("app/verify-email/page.tsx");
  assert.match(verification, /securely prepare your workspace/);
  assert.match(verification, /continue to your dashboard/);
  assert.match(verification, /Continue to sign in/);
  assert.doesNotMatch(verification, /continue to organization onboarding/);
});

test("shared errors explain recovery without exposing internal diagnostics", () => {
  const state = read("features/vayon/components/RouteStates.tsx");
  const root = read("app/error.tsx");
  const onboarding = read("app/onboarding/error.tsx");
  for (const value of ["temporarily unavailable", "records have not been changed", "Try again", "Dashboard", "Support"]) assert.match(state, new RegExp(value));
  assert.match(root + onboarding, /RouteError/);
  assert.doesNotMatch(state + root + onboarding, /error\.message|error\.stack|digest|JSON\.stringify/);
});

test("critical CRM workflow dashboard and billing journeys have loading boundaries", () => {
  for (const path of ["app/loading.tsx", "app/vayon/loading.tsx", "app/vayon/dashboard/loading.tsx", "app/vayon/crm/loading.tsx", "app/vayon/workflows/loading.tsx", "app/vayon/settings/billing/loading.tsx"]) assert.ok(existsSync(path), `${path} should exist`);
  const loading = read("app/loading.tsx") + read("features/vayon/components/RouteStates.tsx");
  assert.match(loading, /aria-busy/);
  assert.match(loading, /motion-reduce:animate-none/);
});

test("one VDS notification component covers every commercial state", () => {
  const feedback = read("features/platform/design-system/components/feedback/Feedback.tsx");
  const auth = read("features/authentication/components/AuthForm.tsx");
  for (const tone of ["info", "success", "warning", "danger", "loading"]) assert.match(feedback, new RegExp(tone));
  assert.match(feedback, /aria-live/);
  assert.match(auth, /Toast/);
});

test("observability has disconnected extension points without external services", () => {
  const contracts = read("lib/observability/contracts.ts");
  const noop = read("lib/observability/noop-adapter.ts");
  const logger = read("lib/observability/logger.ts");
  assert.match(contracts, /captureException/);
  assert.match(contracts, /startSpan/);
  assert.match(noop, /connected = false/);
  assert.match(logger, /correlationId/);
  assert.doesNotMatch(noop + logger, /fetch\(|axios|Sentry\.init|OTLP/i);
});

test("launch candidate report records issues blockers security and RC1 gates", () => {
  const report = read("PRODUCTION_READINESS_LAUNCH_CANDIDATE.md");
  for (const value of ["Issues found and disposition", "Open launch blockers", "Security review", "Performance and accessibility", "Recommended RC1 checklist", "Paddle", "DNS", "TLS", "backup restore", "206 authenticated routes"]) assert.match(report, new RegExp(value, "i"));
});
