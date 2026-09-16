import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { FoundingMemberService } from "@/features/vayon/billing/services/founding-member.service";

export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await new FoundingMemberService().reconcile();
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Reconciliation requires retry" }, { status: 503 }); }
}
