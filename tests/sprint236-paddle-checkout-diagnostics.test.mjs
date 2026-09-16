import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(path, "utf8");
const route = read("app/api/billing/paddle/checkout/route.ts");
const service = read("features/vayon/billing/services/paddle-checkout.service.ts");
const logger = read("lib/observability/logger.ts");
const paddleClient = read("features/vayon/billing/providers/paddle/paddle-client.ts");
const paddleProvider = read("features/vayon/billing/providers/paddle/paddle.provider.ts");
const paddleCatalog = read("features/vayon/billing/providers/paddle/paddle-catalog.ts");
const paddleCustomer = read("features/vayon/billing/services/paddle-customer.service.ts");

test("checkout failures emit one structured, sanitized diagnostic event", () => {
  assert.match(route, /logError\("billing\.paddle\.checkout_failed"/);
  for (const field of ["correlationId", "stage", "planCode", "billingPeriod", "paddleEnvironment", "httpStatus", "paddleErrorCode", "paddleErrorType", "validationField", "errorType", "safeMessage", "configurationPresence"]) assert.match(route, new RegExp(field));
  for (const flag of ["apiKeyPresent", "clientTokenPresent", "webhookSecretPresent", "productConfigured", "priceConfigured"]) assert.match(route, new RegExp(flag));
  assert.doesNotMatch(route, /message: cause|JSON\.stringify\(cause\)|request\.headers|process\.env\)/);
});

test("Paddle API errors retain only safe structured diagnostics", () => {
  assert.match(paddleClient, /class PaddleApiError/);
  assert.match(paddleClient, /safeDiagnosticToken/);
  assert.match(paddleClient, /error\?\.errors\?\.\[0\]\?\.field/);
  assert.doesNotMatch(paddleClient, /body\?\.error\?\.detail/);
  assert.doesNotMatch(route, /detail/);
});

test("transaction creation uses the documented catalog-price checkout payload", () => {
  assert.match(paddleProvider, /items: \[\{ price_id: priceId, quantity: input\.seatQuantity \}\]/);
  assert.match(paddleProvider, /collection_mode: "automatic"/);
  assert.match(paddleProvider, /customer_id: input\.customerId/);
  assert.match(paddleProvider, /custom_data:/);
  assert.doesNotMatch(paddleProvider, /product_id: priceId/);
  assert.doesNotMatch(paddleProvider, /price_id: productId/);
  assert.doesNotMatch(paddleProvider, /(?:address_id|currency_code|billing_details|checkout): undefined/);
  assert.doesNotMatch(paddleProvider, /(?:address_id|currency_code|billing_details|checkout): null/);
});

test("Professional monthly resolves through the configured price mapping and uses a Paddle customer ID", () => {
  assert.match(paddleCatalog, /PADDLE_PRICE_\$\{suffix\}/);
  assert.match(paddleCatalog, /pri_\[a-z0-9\]\+/);
  assert.match(paddleProvider, /const \{ priceId \} = paddleCatalogEntry/);
  assert.match(paddleCustomer, /select\("provider_customer_id"\)/);
  assert.match(paddleCustomer, /if \(linked\) return linked/);
  assert.match(paddleCustomer, /return customer\.id/);
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
