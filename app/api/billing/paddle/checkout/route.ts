import { NextResponse } from "next/server";
import { PaddleCheckoutService } from "@/features/vayon/billing/services/paddle-checkout.service";
import { isPaddlePlanCode } from "@/features/vayon/billing/providers/paddle/paddle-catalog";

type CheckoutError = {
  success: false;
  error: string;
  code: string;
};

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json<CheckoutError>(
    { success: false, error, code },
    { status },
  );
}

function checkoutFailure(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Unknown checkout error.";

  if (message.includes("PADDLE_API_KEY"))
    return errorResponse(
      "Paddle Checkout is not configured.",
      "PADDLE_CONFIGURATION_MISSING",
      503,
    );
  if (message.includes("catalog is not configured"))
    return errorResponse(
      "The selected Paddle price is not configured.",
      "PADDLE_PRICE_NOT_CONFIGURED",
      503,
    );
  if (message.includes("Active organization and workspace"))
    return errorResponse(
      "Select an organization and workspace before starting checkout.",
      "BILLING_CONTEXT_REQUIRED",
      400,
    );
  if (message.includes("billing email"))
    return errorResponse(message, "BILLING_CUSTOMER_INCOMPLETE", 400);
  if (message.includes("Seat quantity"))
    return errorResponse(message, "INVALID_QUANTITY", 400);
  if (message.includes("Paddle API failed"))
    return errorResponse(
      "Paddle could not create the checkout. Please try again.",
      "PADDLE_API_ERROR",
      502,
    );
  if (message.includes("Paddle did not return a checkout URL"))
    return errorResponse(message, "PADDLE_CHECKOUT_URL_MISSING", 502);

  return errorResponse(
    "Paddle Checkout is temporarily unavailable. Please try again.",
    "PADDLE_CHECKOUT_FAILED",
    500,
  );
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      planCode?: string;
      billingPeriod?: string;
      seatQuantity?: number;
    };
    if (
      !input.planCode ||
      !isPaddlePlanCode(input.planCode) ||
      (input.billingPeriod !== "monthly" && input.billingPeriod !== "annual")
    )
      return errorResponse(
        "Invalid checkout selection.",
        "INVALID_CHECKOUT_SELECTION",
        400,
      );

    const checkout = await new PaddleCheckoutService().create(
      input.planCode,
      input.billingPeriod,
      input.seatQuantity ?? 1,
      new URL(request.url).origin,
    );
    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
      url: checkout.url,
      correlationId: checkout.correlationId,
      provider: "paddle" as const,
    });
  } catch (cause) {
    if (cause instanceof SyntaxError)
      return errorResponse(
        "The checkout request must contain valid JSON.",
        "INVALID_JSON",
        400,
      );
    return checkoutFailure(cause);
  }
}
