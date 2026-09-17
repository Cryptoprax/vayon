import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { FoundingMemberService } from "@/features/vayon/billing/services/founding-member.service";

// Temporary one-time recovery route. Delete after the historical founding
// invoice gap for this organization has been confirmed recovered.
const TARGET_ORGANIZATION_NAME = "PRAKYATH VP Organization";

export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const service = new FoundingMemberService();
    const organizationId = await service.organizationIdByName(TARGET_ORGANIZATION_NAME);
    if (!organizationId) return NextResponse.json({ error: "Recovery target not found" }, { status: 503 });
    const result = await service.recoverFoundingInvoice(organizationId);
    return NextResponse.json({ ok: true, alreadyRecovered: !result.recovered });
  } catch { return NextResponse.json({ error: "Invoice recovery requires retry" }, { status: 503 }); }
}
