import { planCodes, type SubscriptionPlanCode } from "../config/entitlements";

export type PlanActionKind = "current" | "checkout" | "upgrade" | "manage" | "contact" | "unavailable";

export interface PlanActionContext {
  readonly planCode: SubscriptionPlanCode;
  readonly currentPlanCode: SubscriptionPlanCode | null;
  readonly hasActiveSubscription: boolean;
  readonly checkoutEnabled: boolean;
  readonly hasClientToken: boolean;
}

/** Canonical, plan-code-driven decision for what a plan card should offer.
 *  Enterprise is never self-service; an unrecognized current plan fails closed
 *  to "unavailable" rather than guessing a direction. A lower-tier target never
 *  resolves to a self-service mutation ("manage" only, never "downgrade") --
 *  immediate self-service downgrade is intentionally not offered at launch,
 *  even though the backend changeSubscription mechanism itself still supports it. */
export function resolvePlanAction(context: PlanActionContext): PlanActionKind {
  if (context.planCode === "enterprise") return "contact";
  if (context.currentPlanCode === context.planCode) return "current";
  if (!context.checkoutEnabled) return "unavailable";
  if (!context.hasActiveSubscription) return context.hasClientToken ? "checkout" : "unavailable";
  const currentIndex = context.currentPlanCode ? planCodes.indexOf(context.currentPlanCode) : -1;
  if (currentIndex === -1) return "unavailable";
  const targetIndex = planCodes.indexOf(context.planCode);
  return targetIndex > currentIndex ? "upgrade" : "manage";
}
