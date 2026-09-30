import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { flagStaleWhatsAppSendExecutions } from "@/features/platform/integrations/whatsapp/whatsapp-send-reconciliation.service";

/**
 * Mirrors app/api/billing/paddle/founding/reconcile/route.ts exactly --
 * the same CRON_SECRET-gated pattern, not a new scheduler. As with that
 * existing route, actually triggering this on a schedule is configured in
 * Vercel's dashboard (or an external cron pinger), outside this repo's
 * vercel.json, which registers no `crons` entry for either route.
 */
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await flagStaleWhatsAppSendExecutions();
    return NextResponse.json({ ok: true, flagged: result.flaggedExecutionIds.length });
  } catch { return NextResponse.json({ error: "Reconciliation requires retry" }, { status: 503 }); }
}
