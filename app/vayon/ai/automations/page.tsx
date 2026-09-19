import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export default async function Page() {
  try {
    await requireEntitlement("ai_workforce");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="ai_workforce" label="Smart Automations" />;
    throw error;
  }
  // Smart Automations has no tenant-backed implementation yet (verified: the prior
  // AutomationRules component rendered fixed, hardcoded example rules identical for
  // every organization). Showing that as if it were this workspace's own configuration
  // would be misleading, so this renders the existing honest "not available yet" state.
  return <FeatureAvailabilityState title="Smart Automations" description="Automation rules for your AI workforce are not available yet for this workspace." />;
}
