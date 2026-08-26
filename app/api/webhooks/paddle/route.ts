import { NextResponse } from "next/server";
import { PaddleWebhookSignatureError } from "@/features/vayon/billing/providers/paddle/paddle.provider";
import { PaddleWebhookService } from "@/features/vayon/billing/services/paddle-webhook.service";

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature");
  if (!signature)
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  try {
    await new PaddleWebhookService().process(await request.text(), signature);
    return NextResponse.json({ received: true });
  } catch (reason) {
    if (reason instanceof PaddleWebhookSignatureError)
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
