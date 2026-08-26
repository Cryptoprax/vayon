import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const route = read("app/api/billing/paddle/checkout/route.ts");
const client = read("features/vayon/billing/components/CommercialPlatform.tsx");
const paddleClient = read(
  "features/vayon/billing/providers/paddle/paddle-client.ts",
);

test("checkout route always owns success and error JSON envelopes", () => {
  assert.match(route, /try\s*\{/);
  assert.match(route, /catch \(cause\)/);
  assert.match(route, /success: true/);
  assert.match(route, /checkoutUrl: checkout\.url/);
  assert.match(route, /url: checkout\.url/);
  assert.match(route, /correlationId: checkout\.correlationId/);
  assert.match(route, /provider: "paddle"/);
  assert.match(route, /success: false/);
  for (const code of [
    "INVALID_JSON",
    "INVALID_CHECKOUT_SELECTION",
    "PADDLE_CONFIGURATION_MISSING",
    "PADDLE_PRICE_NOT_CONFIGURED",
    "BILLING_CONTEXT_REQUIRED",
    "BILLING_CUSTOMER_INCOMPLETE",
    "PADDLE_API_ERROR",
    "PADDLE_CHECKOUT_URL_MISSING",
    "PADDLE_CHECKOUT_FAILED",
  ])
    assert.match(route, new RegExp(code));
});

test("checkout UI safely handles empty or invalid response bodies", () => {
  assert.doesNotMatch(client, /response\.json\(\)/);
  assert.match(client, /await response\.text\(\)/);
  assert.match(client, /if \(!text\.trim\(\)\) return null/);
  assert.match(client, /try\s*\{[\s\S]*JSON\.parse\(text\)/);
  assert.match(client, /if \(!response\.ok \|\| !result\.success\)/);
  assert.match(client, /if \(!result\.checkoutUrl\)/);
  assert.match(client, /window\.location\.assign\(result\.checkoutUrl\)/);
});

test("Paddle client rejects empty and invalid provider JSON explicitly", () => {
  assert.doesNotMatch(paddleClient, /await response\.json\(\)/);
  assert.match(paddleClient, /await response\.text\(\)/);
  assert.match(paddleClient, /Paddle API returned invalid JSON/);
  assert.match(paddleClient, /Paddle API returned an empty response/);
});
