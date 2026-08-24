import {
  minimumPlanFor, subscriptionEntitlementCatalog, type EntitlementFeature, type EntitlementQuota,
  type EntitlementState, type SubscriptionPlanCode,
} from "../config/entitlements";

export interface EntitlementDecision {
  readonly allowed: boolean;
  readonly state: EntitlementState;
  readonly feature?: EntitlementFeature;
  readonly quota?: EntitlementQuota;
  readonly usage?: number;
  readonly limit?: number | null;
  readonly currentPlan: SubscriptionPlanCode;
  readonly targetPlan: SubscriptionPlanCode | null;
  readonly reason: string;
  readonly founderOverride: boolean;
}

export interface EntitlementPolicyContext {
  readonly plan: SubscriptionPlanCode;
  readonly subscriptionStatus?: string;
  readonly expiresAt?: string | null;
  readonly founder?: boolean;
}

function base(context: EntitlementPolicyContext) {
  const founderOverride = context.founder === true;
  const expired = Boolean(context.expiresAt && Date.parse(context.expiresAt) <= Date.now());
  return { founderOverride, expired };
}

export function evaluateFeatureEntitlement(context: EntitlementPolicyContext, feature: EntitlementFeature): EntitlementDecision {
  const { founderOverride, expired } = base(context);
  if (founderOverride) return { allowed: true, state: "enabled", feature, currentPlan: context.plan, targetPlan: null, reason: "Founder accounts are exempt from subscription limits.", founderOverride: true };
  if (expired) return { allowed: false, state: "expiration", feature, currentPlan: context.plan, targetPlan: minimumPlanFor(feature), reason: "The subscription entitlement has expired.", founderOverride: false };
  const allowed = (subscriptionEntitlementCatalog[context.plan].features as readonly EntitlementFeature[]).includes(feature);
  if (!allowed) return { allowed: false, state: "disabled", feature, currentPlan: context.plan, targetPlan: minimumPlanFor(feature), reason: `${feature.replaceAll("_", " ")} is not included in the ${subscriptionEntitlementCatalog[context.plan].name} plan.`, founderOverride: false };
  const trial = context.subscriptionStatus === "trialing";
  return { allowed: true, state: trial ? "trial" : "enabled", feature, currentPlan: context.plan, targetPlan: null, reason: trial ? "Available during the current trial." : "Included in the current subscription.", founderOverride: false };
}

export function evaluateQuotaEntitlement(context: EntitlementPolicyContext, quota: EntitlementQuota, usage: number, increment = 0): EntitlementDecision {
  const { founderOverride, expired } = base(context), limit = subscriptionEntitlementCatalog[context.plan].quotas[quota];
  if (founderOverride) return { allowed: true, state: "enabled", quota, usage, limit: null, currentPlan: context.plan, targetPlan: null, reason: "Founder accounts are exempt from subscription limits.", founderOverride: true };
  if (expired) return { allowed: false, state: "expiration", quota, usage, limit, currentPlan: context.plan, targetPlan: nextPlan(context.plan), reason: "The subscription entitlement has expired.", founderOverride: false };
  if (limit === null) return { allowed: true, state: context.subscriptionStatus === "trialing" ? "trial" : "enabled", quota, usage, limit, currentPlan: context.plan, targetPlan: null, reason: "This quota is unlimited.", founderOverride: false };
  const allowed = usage + increment <= limit;
  return { allowed, state: allowed ? "limited" : "quota", quota, usage, limit, currentPlan: context.plan, targetPlan: allowed ? null : nextPlan(context.plan), reason: allowed ? `${usage} of ${limit} used.` : `${quota.replaceAll("_", " ")} quota reached (${usage} of ${limit}).`, founderOverride: false };
}

function nextPlan(plan: SubscriptionPlanCode): SubscriptionPlanCode | null {
  const order: readonly SubscriptionPlanCode[] = ["starter", "professional", "business", "enterprise"];
  return order[order.indexOf(plan) + 1] ?? null;
}
