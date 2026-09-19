import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await requireEntitlement("ai_workforce");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="ai_workforce" label="AI Goals & Strategy" />;
    throw error;
  }
  // AI Goals & Strategy has no tenant-backed implementation yet (verified: the prior
  // GoalsAndStrategy component rendered fixed, hardcoded example content identical for
  // every organization). Showing that as if it were this workspace's own data would be
  // misleading, so this renders the existing honest "not available yet" state instead.
  return <FeatureAvailabilityState title="AI Goals & Strategy" description="Goal tracking for your AI workforce is not available yet for this workspace." />;
}
