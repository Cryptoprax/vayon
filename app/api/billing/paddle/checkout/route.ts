import { NextResponse } from "next/server";
import { PaddleCheckoutService } from "@/features/vayon/billing/services/paddle-checkout.service";
import { isPaddlePlanCode } from "@/features/vayon/billing/providers/paddle/paddle-catalog";

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Invalid checkout selection" }, { status: 400 });
  const checkout = await new PaddleCheckoutService().create(
    input.planCode,
    input.billingPeriod,
    input.seatQuantity ?? 1,
    new URL(request.url).origin,
  );
  return NextResponse.json(checkout);
}
