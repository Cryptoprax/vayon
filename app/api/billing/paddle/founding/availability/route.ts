import { NextResponse } from "next/server";
import { foundingAvailability } from "@/features/vayon/billing/services/founding-member.service";

export async function GET() {
  const state = await foundingAvailability();
  // Deliberately omit all organization-specific and provider data.
  return NextResponse.json({ available: state.eligible && state.remaining > 0 }, { headers: { "Cache-Control": "no-store" } });
}
