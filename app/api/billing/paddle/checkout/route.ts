import { NextResponse } from "next/server";
import { log, logError } from "@/lib/observability/logger";
import { PaddleCheckoutService } from "@/features/vayon/billing/services/paddle-checkout.service";
import { isPaddlePlanCode } from "@/features/vayon/billing/providers/paddle/paddle-catalog";

type CheckoutError = { success: false; error: string; code: string };
type CheckoutStage = "checkout.request_received" | "checkout.auth_validated" | "checkout.context_validated" | "checkout.config_validated" | "checkout.customer_create_started" | "checkout.transaction_create_started" | "checkout.transaction_created" | "checkout.response_created";
type Selection = { planCode: string | null; billingPeriod: "monthly" | "annual" | null };

function errorResponse(error: string, code: string, status: number) { return NextResponse.json<CheckoutError>({ success: false, error, code }, { status }); }
function checkoutFailure(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Unknown checkout error.";
  if (message.includes("PADDLE_API_KEY")) return errorResponse("Paddle Checkout is not configured.", "PADDLE_CONFIGURATION_MISSING", 503);
  if (message.includes("catalog is not configured")) return errorResponse("The selected Paddle price is not configured.", "PADDLE_PRICE_NOT_CONFIGURED", 503);
  if (message.includes("Active organization and workspace")) return errorResponse("Select an organization and workspace before starting checkout.", "BILLING_CONTEXT_REQUIRED", 400);
  if (message.includes("billing email")) return errorResponse(message, "BILLING_CUSTOMER_INCOMPLETE", 400);
  if (message.includes("Seat quantity")) return errorResponse(message, "INVALID_QUANTITY", 400);
  if (message.includes("Paddle API failed")) return errorResponse("Paddle could not create the checkout. Please try again.", "PADDLE_API_ERROR", 502);
  if (message.includes("Paddle did not return a checkout URL")) return errorResponse(message, "PADDLE_CHECKOUT_URL_MISSING", 502);
  return errorResponse("Paddle Checkout is temporarily unavailable. Please try again.", "PADDLE_CHECKOUT_FAILED", 500);
}
function selection(input: { planCode?: string; billingPeriod?: string }): Selection { return { planCode: input.planCode && isPaddlePlanCode(input.planCode) ? input.planCode : null, billingPeriod: input.billingPeriod === "monthly" || input.billingPeriod === "annual" ? input.billingPeriod : null }; }
function configurationPresence(planCode: string | null, billingPeriod: "monthly" | "annual" | null) {
  const plan = planCode?.toUpperCase();
  return { apiKeyPresent: Boolean(process.env.PADDLE_API_KEY), clientTokenPresent: Boolean(process.env.PADDLE_CLIENT_TOKEN), webhookSecretPresent: Boolean(process.env.PADDLE_WEBHOOK_SECRET), productConfigured: Boolean(plan && process.env[`PADDLE_PRODUCT_${plan}`]), priceConfigured: Boolean(plan && billingPeriod && process.env[`PADDLE_PRICE_${plan}_${billingPeriod.toUpperCase()}`]) };
}
function failureCategory(cause: unknown) {
  const status = httpStatus(cause);
  if (status === 401 || status === 403) return "paddle_api_authentication_failed";
  if (status === 404) return "paddle_resource_unavailable";
  if (status === 400 || status === 422) return "paddle_transaction_validation_failed";
  const message = cause instanceof Error ? cause.message : "";
  if (message.includes("PADDLE_ENVIRONMENT")) return "paddle_environment_invalid";
  if (message.includes("catalog is not configured")) return "paddle_mapping_missing";
  if (message.includes("PADDLE_API_KEY")) return "paddle_configuration_missing";
  if (message.includes("Active organization and workspace") || message.includes("Billing changes require")) return "billing_context_or_permission";
  if (message.includes("Paddle API")) return "paddle_api_request_failed";
  if (message.includes("billing email")) return "billing_customer_incomplete";
  return "unexpected_checkout_failure";
}function httpStatus(cause: unknown) { return typeof cause === "object" && cause && "status" in cause && Number.isInteger(Number(cause.status)) ? Number(cause.status) : null; }

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  let stage: CheckoutStage = "checkout.request_received";
  let input: { planCode?: string; billingPeriod?: string; seatQuantity?: number } = {};
  log("billing.paddle.checkout_requested", { correlationId, stage });
  try {
    input = (await request.json()) as typeof input;
    const selected = selection(input);
    if (!selected.planCode || !selected.billingPeriod) return errorResponse("Invalid checkout selection.", "INVALID_CHECKOUT_SELECTION", 400);
    const checkout = await new PaddleCheckoutService().create(selected.planCode, selected.billingPeriod, input.seatQuantity ?? 1, new URL(request.url).origin, (nextStage) => { stage = nextStage; });
    stage = "checkout.response_created";
    log("billing.paddle.checkout_created", { correlationId: checkout.correlationId, stage, planCode: selected.planCode, billingPeriod: selected.billingPeriod });
    return NextResponse.json({ success: true, checkoutUrl: checkout.url, transactionId: checkout.transactionId, url: checkout.url, correlationId: checkout.correlationId, provider: "paddle" as const });
  } catch (cause) {
    const selected = selection(input);
    if (cause instanceof SyntaxError) return errorResponse("The checkout request must contain valid JSON.", "INVALID_JSON", 400);
    logError("billing.paddle.checkout_failed", { correlationId, stage, planCode: selected.planCode, billingPeriod: selected.billingPeriod, paddleEnvironment: process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : process.env.PADDLE_ENVIRONMENT === "live" ? "live" : "invalid", httpStatus: httpStatus(cause), paddleErrorCode: typeof cause === "object" && cause && "code" in cause ? String(cause.code) : null, errorType: cause instanceof Error ? cause.name : "UnknownError", safeMessage: failureCategory(cause), configurationPresence: configurationPresence(selected.planCode, selected.billingPeriod) });
    return checkoutFailure(cause);
  }
}
