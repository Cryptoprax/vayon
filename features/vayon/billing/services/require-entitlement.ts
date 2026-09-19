import "server-only";
import type { EntitlementFeature } from "../config/entitlements";
import type { EntitlementDecision } from "./entitlement-policy";
import { SubscriptionEntitlementError, SubscriptionEntitlementService } from "./entitlement.service";

/** The organization's current plan genuinely does not include this feature. */
export class FeatureNotEntitledError extends Error {
  constructor(readonly decision: EntitlementDecision) {
    super(decision.reason);
    this.name = "FeatureNotEntitledError";
  }
}

/** The plan would include the feature, but the subscription itself is unverified or expired. */
export class SubscriptionProblemError extends Error {
  constructor(readonly decision: EntitlementDecision) {
    super(decision.reason);
    this.name = "SubscriptionProblemError";
  }
}

/** Anything else that prevented the entitlement decision from being made at all. */
export class UnexpectedEntitlementError extends Error {
  constructor(readonly cause: unknown) {
    super("Could not determine feature entitlement.");
    this.name = "UnexpectedEntitlementError";
  }
}

/**
 * Reusable server-side feature guard for Server Components, server actions, and
 * Route Handlers. The authoritative decision still comes entirely from
 * SubscriptionEntitlementService / subscriptionEntitlementCatalog -- this function
 * adds no plan-ranking or plan-name logic of its own, and never redirects. Callers
 * decide what a denial means in their own context (upgrade screen, 403 JSON, an
 * action error, or a disabled control).
 */
export async function requireEntitlement(feature: EntitlementFeature): Promise<EntitlementDecision> {
  try {
    return await new SubscriptionEntitlementService().requireFeature(feature);
  } catch (error) {
    if (error instanceof SubscriptionEntitlementError) {
      if (error.decision.state === "expiration") throw new SubscriptionProblemError(error.decision);
      throw new FeatureNotEntitledError(error.decision);
    }
    throw new UnexpectedEntitlementError(error);
  }
}
