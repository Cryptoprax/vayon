import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const route = read("app/api/billing/paddle/checkout/route.ts");
const service = read("features/vayon/billing/services/paddle-checkout.service.ts");
const logger = read("lib/observability/logger.ts");

test("checkout failures emit one structured, sanitized diagnostic event", () => {
  assert.match(route, /logError\("billing\.paddle\.checkout_failed"/);
  for (const field of ["correlationId", "stage", "planCode", "billingPeriod", "paddleEnvironment", "httpStatus", "paddleErrorCode", "errorType", "safeMessage", "configurationPresence"]) assert.match(route, new RegExp(field));
  for (const flag of ["apiKeyPresent", "clientTokenPresent", "webhookSecretPresent", "productConfigured", "priceConfigured"]) assert.match(route, new RegExp(flag));
  assert.doesNotMatch(route, /message: cause|JSON\.stringify\(cause\)|request\.headers|process\.env\)/);
});

test("stage callbacks distinguish checkout validation from Paddle customer and transaction calls", () => {
  for (const stage of ["checkout.auth_validated", "checkout.context_validated", "checkout.config_validated", "checkout.customer_create_started", "checkout.transaction_create_started", "checkout.transaction_created"]) assert.match(service, new RegExp(stage));
  assert.match(route, /checkout\.request_received/);
  for (const category of ["paddle_api_authentication_failed", "paddle_resource_unavailable", "paddle_transaction_validation_failed", "billing_context_or_permission"]) assert.match(route, new RegExp(category));
  assert.match(route, /checkout\.response_created/);
});

test("logger permits presence booleans but never serializes secret-bearing fields", () => {
  assert.match(logger, /presenceFlag/);
  assert.match(logger, /secret\|token\|password\|key/);
  assert.match(logger, /logError/);
  assert.doesNotMatch(route, /PADDLE_API_KEY[^)]*process\.env\.PADDLE_API_KEY/);
  assert.doesNotMatch(route, /PADDLE_WEBHOOK_SECRET[^)]*process\.env\.PADDLE_WEBHOOK_SECRET/);
});

test("browser checkout response remains sanitized", () => {
  assert.match(route, /PADDLE_CHECKOUT_FAILED/);
  assert.match(route, /Paddle Checkout is temporarily unavailable/);
  assert.doesNotMatch(route, /return errorResponse\(message, "PADDLE_CHECKOUT_FAILED/);
});
