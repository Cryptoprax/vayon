import { WorkspaceContent, WorkspaceHeader, WorkspaceEmptyState } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { minimumPlanFor, subscriptionEntitlementCatalog, type EntitlementFeature } from "../config/entitlements";

/**
 * Shared page-level denial state for a feature the current plan does not include.
 * The required plan name is derived from the canonical entitlement catalog rather
 * than hardcoded, so this never drifts from subscriptionEntitlementCatalog. Never
 * initiates checkout or a plan change itself -- it only links to the billing page,
 * where the customer must take an explicit action.
 */
export function EntitlementUpgradeRequired({ feature, label }: { readonly feature: EntitlementFeature; readonly label: string }) {
  const requiredPlan = minimumPlanFor(feature);
  const planName = requiredPlan ? subscriptionEntitlementCatalog[requiredPlan].name : "a higher";
  return (
    <WorkspaceContent>
      <WorkspaceHeader title={label} />
      <WorkspaceEmptyState
        title={`Available on the ${planName} plan.`}
        description={`${label} is included starting on VAYON's ${planName} plan. Upgrade to unlock it for this workspace.`}
        nextStep="Compare plans to see what's included at each tier."
        action={{ label: "View Plans", href: "/vayon/settings/billing" }}
      />
    </WorkspaceContent>
  );
}
