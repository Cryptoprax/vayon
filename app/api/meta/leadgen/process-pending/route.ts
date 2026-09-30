import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { processPendingMetaLeadgenEvents } from "@/features/platform/integrations/meta-marketing/webhook/lead-detail-fetch.service";

/**
 * Phase M4: the internal lead-detail-fetch processor. Mirrors
 * app/api/whatsapp/send-executions/reconcile/route.ts and
 * app/api/billing/paddle/founding/reconcile/route.ts exactly -- the same
 * CRON_SECRET-gated pattern, not a new scheduler. Deliberately separate from
 * the M3 webhook ACK (Part 24): the webhook durably records the event and
 * returns 200 immediately; this route claims a bounded batch and performs
 * the (network-latency-bound) Graph fetch on its own schedule. As with the
 * existing reconcile routes, actually triggering this on a schedule is
 * configured outside this repo (Vercel dashboard / external cron pinger) --
 * no `crons` entry is registered here.
 *
 * The response contains only counts -- no leadgenId, no normalized field, no
 * PII (Part 25/Part 15).
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
    const result = await processPendingMetaLeadgenEvents(client);
    const fetched = result.results.filter((r) => r.outcome === "fetched").length;
    const failed = result.results.length - fetched;
    return NextResponse.json({ ok: true, claimed: result.claimed, fetched, failed });
  } catch {
    return NextResponse.json({ error: "Processing requires retry" }, { status: 503 });
  }
}
