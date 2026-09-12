import "server-only";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { redirect } from "next/navigation";
import { SubscriptionWriteService } from "./subscription-write.service";
import { subscriptionCenterHref, subscriptionFailure, subscriptionMessage, type SubscriptionWriteResource } from "./subscription-write-contract";

export function redirectSubscriptionFailure(error: unknown): void {
  // Preserve a commercial redirect when one guarded action is called by another.
  if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT;") && String(error.digest).includes("/vayon/settings/billing?subscription=")) throw error;
  const decision = subscriptionFailure(error);
  if (decision) redirect(subscriptionCenterHref(decision));
}
export async function guardSubscriptionAction(resource: SubscriptionWriteResource = "write", email?: string) {
  try { await new SubscriptionWriteService().require(resource, email); }
  catch (error) { redirectSubscriptionFailure(error); throw error; }
}
export async function guardSubscriptionApi() {
  if (!await new AuthenticationService().user()) return Response.json({ message: "Sign in to continue." }, { status: 401 });
  let decision;
  try { decision = await new SubscriptionWriteService().check(); }
  catch { decision = { allowed: false as const, code: "SUBSCRIPTION_UNVERIFIED" as const, resource: "write" as const }; }
  return decision.allowed ? null : Response.json({ ...decision, message: subscriptionMessage(decision), subscriptionCenter: subscriptionCenterHref(decision) }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
}
