import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { notFound } from "next/navigation";
import {
  ApprovalDetail,
  GovernanceHeader,
  GovernanceNav,
} from "@/features/vayon/workflow-approval/components/GovernanceViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
export default async function Page({
  params,
}: {
  params: Promise<{ approvalId: string }>;
}) {
  const { approvalId } = await params;
  const result = new GovernanceService().approval(approvalId);
  if (!result.approval) notFound();
  return (
    <WorkspaceContent >
      <GovernanceHeader
        title="Approval Record"
        description="Immutable decision context and audit evidence for a governed execution request."
      />
      <GovernanceNav />
      <ApprovalDetail item={result.approval} audit={result.audit} />
    </WorkspaceContent>
  );
}
