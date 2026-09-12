export type SubscriptionWriteResource = "write" | "properties" | "leads" | "companies" | "members";
export type SubscriptionBlockCode = "TRIAL_LIMIT_REACHED" | "TRIAL_EXPIRED" | "SUBSCRIPTION_UNVERIFIED";
export interface SubscriptionWriteDecision {
  allowed: boolean;
  code?: SubscriptionBlockCode;
  resource?: SubscriptionWriteResource;
  usage?: number;
  limit?: number;
}
export function subscriptionMessage(decision: SubscriptionWriteDecision) {
  if (decision.code === "TRIAL_EXPIRED") return "Trial Complete. Your workspace is read-only. Upgrade to create or change records. Viewing, search and your dashboard remain available.";
  if (decision.code === "TRIAL_LIMIT_REACHED") return "You've reached your trial limit. Upgrade your workspace to add more " + (decision.resource === "members" ? "team members" : decision.resource ?? "records") + ".";
  return "We could not confirm your workspace subscription. Open the Subscription Center to review your plan or try again. Your existing data is safe.";
}
export function subscriptionCenterHref(decision: SubscriptionWriteDecision) {
  const code = decision.code === "TRIAL_EXPIRED" ? "expired" : decision.code === "TRIAL_LIMIT_REACHED" ? "limit" : "verify";
  return `/vayon/settings/billing?subscription=${code}&resource=${decision.resource ?? "write"}`;
}
/** Recognize only our bounded commercial errors; never replace ordinary RBAC errors. */
export function subscriptionFailure(error: unknown): SubscriptionWriteDecision | null {
  if (!error || typeof error !== "object") return null;
  if ("decision" in error) {
    const decision = error.decision as SubscriptionWriteDecision;
    if (decision && ["TRIAL_EXPIRED", "TRIAL_LIMIT_REACHED", "SUBSCRIPTION_UNVERIFIED"].includes(decision.code ?? "")) return decision;
  }
  if ("digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_REDIRECT;")) {
    const destination = error.digest.split(";")[2];
    if (destination?.startsWith("/vayon/settings/billing?subscription=")) {
      const params = new URL(destination, "https://internal.invalid").searchParams;
      const code = params.get("subscription");
      const resource = params.get("resource");
      if (["expired", "limit", "verify"].includes(code ?? "")) return { allowed: false, code: code === "expired" ? "TRIAL_EXPIRED" : code === "limit" ? "TRIAL_LIMIT_REACHED" : "SUBSCRIPTION_UNVERIFIED", resource: (["properties", "leads", "companies", "members"].includes(resource ?? "") ? resource : "write") as SubscriptionWriteResource };
    }
  }
  const message = "message" in error ? String(error.message) : "";
  const match = message.match(/^(TRIAL_EXPIRED|TRIAL_LIMIT_REACHED|SUBSCRIPTION_UNVERIFIED)(?::(write|properties|leads|companies|members))?$/);
  return match ? { allowed: false, code: match[1] as SubscriptionBlockCode, resource: (match[2] ?? "write") as SubscriptionWriteResource } : null;
}

/** Preserve structured commercial failures even when a request has already begun streaming. */
export function subscriptionStreamFailure(error: unknown, fallback: string) {
  const decision = subscriptionFailure(error);
  return decision ? { type: "error", ...decision, message: subscriptionMessage(decision), subscriptionCenter: subscriptionCenterHref(decision) } : { type: "error", message: fallback };
}
