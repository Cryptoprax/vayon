import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export const dynamic = "force-dynamic";
export default function Page() {
  // Governed workflow templates previously rendered the demo GovernanceService's
  // hardcoded in-memory "governed-crm-actions" fixture -- not real tenant data.
  // Phase D1 built a real, tenant-scoped Approval Workflows foundation (see
  // /vayon/approvals) but deliberately did not build workflow-template
  // persistence, so this route has no real data to show yet.
  return <FeatureAvailabilityState title="Governed Workflow" description="Custom governed workflow templates are not available yet for this workspace." />;
}
