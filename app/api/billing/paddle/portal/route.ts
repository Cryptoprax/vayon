import { NextResponse } from "next/server";
import { PaddleCustomerService } from "@/features/vayon/billing/services/paddle-customer.service";

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const portal = await new PaddleCustomerService().portal(`${origin}/vayon/settings/billing`);
    return NextResponse.json(portal);
  } catch {
    return NextResponse.json({ error: "The billing portal is temporarily unavailable.", code: "PADDLE_PORTAL_UNAVAILABLE", retryable: true }, { status: 503 });
  }
}
