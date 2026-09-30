import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import {
  ApprovalRequestList,
  GovernanceHeader,
  RequestApprovalForm,
} from "@/features/vayon/workflow-approval/components/GovernanceViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";

export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await requireEntitlement("approvals");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="approvals" label="Approval Workflows" />;
    throw error;
  }
  const permissions = new WorkspacePermissionService();
  const [approvals, decideCheck] = await Promise.all([
    (await GovernanceService.production()).approvals(),
    permissions.check("approvals", "approve"),
  ]);
  return (
    <WorkspaceContent >
      <GovernanceHeader
        title="Real Estate Approval Center"
        description="Review property, listing, pricing, commission, offer, assignment, campaign, publication, contract, description, and media decisions with evidence and a full decision history."
      />
      <section className="mb-6 rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="approval-types-title">
        <h2 id="approval-types-title" className="font-semibold">Real estate approval types</h2>
        <p className="mt-2 text-sm leading-6 text-vds-muted">Publish Listing · Price Revision · Property Status · Commission · Discount · Offer Acceptance · Offer Rejection · Agent Assignment · Contract Approval · Marketing Campaign · Listing Removal · Media Approval</p>
      </section>
      <section className="mb-6 rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="request-approval-title">
        <h2 id="request-approval-title" className="font-semibold">Request an approval</h2>
        <div className="mt-3"><RequestApprovalForm /></div>
      </section>
      <ApprovalRequestList items={approvals} canDecide={decideCheck.decision.allowed} />
    </WorkspaceContent>
  );
}
