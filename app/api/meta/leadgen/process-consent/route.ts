import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { processPendingMetaLeadConsent } from "@/features/platform/integrations/meta-marketing/webhook/consent-processing.service";

/**
 * Phase M6: the internal consent-evaluation processor. Mirrors
 * app/api/meta/leadgen/process-pending/route.ts (M4) and
 * app/api/meta/leadgen/process-crm-ingestion/route.ts (M5) exactly -- the
 * same CRON_SECRET-gated pattern. A separate, independent stage from both:
 * it only claims M5-completed rows (crm_ingestion_status='completed') and
 * never touches Graph fetch or CRM identity resolution. The M3 webhook
 * remains fully independent of this stage.
 *
 * NO WHATSAPP SEND. This route only evaluates and records consent evidence
 * -- it never calls the WhatsApp Cloud API.
 *
 * The response contains only counts -- no leadId, no consentId, no PII.
 */
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const client = createSupabaseServiceClient();
    const result = await processPendingMetaLeadConsent(client);
    const granted = result.results.filter((r) => r.outcome === "granted").length;
    const notGranted = result.results.filter((r) => r.outcome === "not_granted").length;
    const noRule = result.results.filter((r) => r.outcome === "no_rule").length;
    const unverifiable = result.results.filter((r) => r.outcome === "unverifiable").length;
    return NextResponse.json({ ok: true, claimed: result.claimed, granted, notGranted, noRule, unverifiable });
  } catch {
    return NextResponse.json({ error: "Processing requires retry" }, { status: 503 });
  }
}
