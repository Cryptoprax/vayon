import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { flagStaleWhatsAppOutreachExecutions } from "@/features/platform/integrations/whatsapp/whatsapp-outreach-reconciliation.service";

/**
 * Phase M7, mirroring app/api/whatsapp/send-executions/reconcile/route.ts
 * (E6) exactly -- the same CRON_SECRET-gated pattern, not a new scheduler.
 * No `crons` entry is registered in vercel.json; scheduling is external.
 */
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await flagStaleWhatsAppOutreachExecutions();
    return NextResponse.json({ ok: true, flagged: result.flaggedExecutionIds.length });
  } catch { return NextResponse.json({ error: "Reconciliation requires retry" }, { status: 503 }); }
}
