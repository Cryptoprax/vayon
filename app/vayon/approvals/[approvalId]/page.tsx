import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { notFound } from "next/navigation";
import {
  ApprovalRequestDetail,
  GovernanceHeader,
} from "@/features/vayon/workflow-approval/components/GovernanceViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";

export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ approvalId: string }>;
}) {
  try {
    await requireEntitlement("approvals");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="approvals" label="Approval Workflows" />;
    throw error;
  }
  const { approvalId } = await params;
  const permissions = new WorkspacePermissionService();
  const [result, decideCheck] = await Promise.all([
    (await GovernanceService.production()).approval(approvalId),
    permissions.check("approvals", "approve"),
  ]);
  if (!result.approval) notFound();
  const canCancel = decideCheck.decision.allowed || result.approval.requestedBy === decideCheck.context.actorId;
  return (
    <WorkspaceContent >
      <GovernanceHeader
        title="Approval Record"
        description="Decision context and history for a governed approval request."
      />
      <ApprovalRequestDetail item={result.approval} events={result.events} canDecide={decideCheck.decision.allowed} canCancel={canCancel} />
    </WorkspaceContent>
  );
}
