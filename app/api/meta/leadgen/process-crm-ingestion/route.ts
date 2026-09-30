import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { processPendingMetaLeadCrmIngestion } from "@/features/platform/integrations/meta-marketing/webhook/crm-ingestion.service";

/**
 * Phase M5: the internal CRM-ingestion processor. Mirrors
 * app/api/meta/leadgen/process-pending/route.ts (M4) and
 * app/api/whatsapp/send-executions/reconcile/route.ts exactly -- the same
 * CRON_SECRET-gated pattern, not a new scheduler. Deliberately a SEPARATE
 * stage from M4's Graph-fetch processor (Part 29): M4 fetch and M5 CRM
 * ingestion are two independent, sequential background stages, never one
 * combined transaction and never coupled to the M3 webhook ACK. As with the
 * existing reconcile routes, actually triggering this on a schedule is
 * configured outside this repo -- no `crons` entry is registered here.
 *
 * The response contains only counts -- no leadgenId, no leadId, no PII.
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
    const result = await processPendingMetaLeadCrmIngestion(client);
    const completed = result.results.filter((r) => r.outcome === "completed").length;
    const identityConflict = result.results.filter((r) => r.outcome === "identity_conflict").length;
    const failed = result.results.filter((r) => r.outcome === "failed").length;
    return NextResponse.json({ ok: true, claimed: result.claimed, completed, identityConflict, failed });
  } catch {
    return NextResponse.json({ error: "Processing requires retry" }, { status: 503 });
  }
}
