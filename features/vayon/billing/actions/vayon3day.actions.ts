"use server";
import { billingContext } from "../services/billing-context";

export type Vayon3DayResult = { ok: boolean; code: "REDEEMED" | "INVALID_CODE" | "ALREADY_USED" | "PAID_SUBSCRIPTION" | "LEGACY_TRIAL_USED" | "SUBSCRIPTION_UNVERIFIED" | "UNAVAILABLE"; accessEndsAt?: string };

export async function redeemVayon3Day(code: string): Promise<Vayon3DayResult> {
  const context = await billingContext("manage");
  const { data, error } = await context.client.rpc("redeem_vayon3day", { p_code: code });
  if (error || !data || typeof data !== "object") return { ok: false, code: "UNAVAILABLE" };
  const result = data as { ok?: unknown; code?: unknown; access_ends_at?: unknown };
  const allowed = ["REDEEMED","INVALID_CODE","ALREADY_USED","PAID_SUBSCRIPTION","LEGACY_TRIAL_USED","SUBSCRIPTION_UNVERIFIED"] as const;
  const resultCode = allowed.includes(result.code as typeof allowed[number]) ? result.code as typeof allowed[number] : "UNAVAILABLE";
  return { ok: result.ok === true && resultCode === "REDEEMED", code: resultCode, accessEndsAt: typeof result.access_ends_at === "string" ? result.access_ends_at : undefined };
}
