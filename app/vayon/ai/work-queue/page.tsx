import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await requireEntitlement("ai_workforce");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="ai_workforce" label="AI Work Queue" />;
    throw error;
  }
  // AI Work Queue has no tenant-backed implementation yet (verified: both AIWorkQueue and
  // EmployeeActivity rendered fixed, hardcoded example content identical for every
  // organization, with no database query anywhere in the page or its components).
  // Showing that as if it were this workspace's own live queue would be misleading, so
  // this renders the existing honest "not available yet" state instead.
  return <FeatureAvailabilityState title="AI Work Queue" description="A live, per-workspace work queue for your AI workforce is not available yet." />;
}
