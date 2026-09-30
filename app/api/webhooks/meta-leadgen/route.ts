import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { verifyMetaSignature } from "@/features/platform/integrations/meta-marketing/webhook/signature";
import { processMetaLeadgenWebhookPayload } from "@/features/platform/integrations/meta-marketing/webhook/process-leadgen-webhook";

/**
 * Phase M3: Meta Lead Ads webhook. Deliberately a separate route from
 * app/api/webhooks/whatsapp -- different Meta webhook subscription (leadgen
 * change events on a Page, not WhatsApp Cloud API messages), even though the
 * signature mechanics are the same Meta App primitive. No rate limiter is
 * applied here (Part 19): signature verification + the RPC's atomic dedup
 * are the primary protections, matching the existing WhatsApp webhook route,
 * which also does not call EnterpriseRateLimitService despite the
 * "provider-webhooks" boundary existing -- the in-memory limiter would not
 * coordinate across instances and risks throttling legitimate Meta retries.
 */
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const challenge = params.get("hub.challenge");
  if (params.get("hub.mode") === "subscribe" && challenge && params.get("hub.verify_token") === process.env.META_LEADGEN_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  if (!verifyMetaSignature(raw, signature, process.env.META_APP_SECRET)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  try {
    const client = createSupabaseServiceClient();
    const { ok } = await processMetaLeadgenWebhookPayload(client, payload);
    // A signed, valid request is acknowledged even when individual changes are
    // duplicates or unresolved (durably recorded either way) -- only an
    // unexpected persistence failure returns non-2xx so Meta retries (Part 16).
    return NextResponse.json({ received: true }, { status: ok ? 200 : 500 });
  } catch {
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
