import "server-only";
import { isFounder } from "@/features/platform/founder/services/founder-context";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { log } from "@/lib/observability/logger";
import { isSubscriptionPlanCode, type EntitlementFeature, type EntitlementQuota } from "../config/entitlements";
import { evaluateFeatureEntitlement, evaluateQuotaEntitlement, type EntitlementDecision } from "./entitlement-policy";

export class SubscriptionEntitlementError extends Error {
  constructor(readonly decision: EntitlementDecision) { super(decision.reason); this.name = "SubscriptionEntitlementError"; }
}

export class SubscriptionEntitlementService {
  private async context() {
    const context = await operationsContext();
    const [{ data: auth }, { data: subscription, error }] = await Promise.all([
      context.client.auth.getUser(),
      context.client.from("subscriptions").select("status,trial_ends_at,current_period_ends_at,subscription_plans(code)").eq("organization_id", context.organizationId).eq("workspace_id", context.workspaceId).is("deleted_at", null).maybeSingle(),
    ]);
    if (error) throw error;
    const joined = subscription?.subscription_plans as unknown as { code?: string } | null;
    const code = joined?.code ?? "starter";
    if (!isSubscriptionPlanCode(code)) throw new Error(`Unsupported subscription plan: ${code}`);
    const status = String(subscription?.status ?? "trialing");
    const expiresAt = status === "trialing" ? subscription?.trial_ends_at ?? null : status === "cancelled" || status === "suspended" ? subscription?.current_period_ends_at ?? null : null;
    return { ...context, plan: code, status, expiresAt, founder: isFounder(auth.user) };
  }

  async feature(feature: EntitlementFeature) { const c = await this.context(); return evaluateFeatureEntitlement({ plan: c.plan, subscriptionStatus: c.status, expiresAt: c.expiresAt, founder: c.founder }, feature); }
  async quota(quota: EntitlementQuota, usage: number, increment = 0) { const c = await this.context(); return evaluateQuotaEntitlement({ plan: c.plan, subscriptionStatus: c.status, expiresAt: c.expiresAt, founder: c.founder }, quota, usage, increment); }
  async requireFeature(feature: EntitlementFeature) { const decision = await this.feature(feature); if (!decision.allowed) this.deny(decision); return decision; }
  async requireQuota(quota: EntitlementQuota, usage: number, increment = 0) { const decision = await this.quota(quota, usage, increment); if (!decision.allowed) this.deny(decision); return decision; }
  private deny(decision: EntitlementDecision): never { log("subscription.entitlement_denied", { feature: decision.feature, quota: decision.quota, currentPlan: decision.currentPlan, targetPlan: decision.targetPlan, reason: decision.reason }); throw new SubscriptionEntitlementError(decision); }
}
