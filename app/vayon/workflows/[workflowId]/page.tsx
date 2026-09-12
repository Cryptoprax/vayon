import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { notFound } from "next/navigation";
import {
  GovernanceHeader,
  GovernanceNav,
  WorkflowDetail,
} from "@/features/vayon/workflow-approval/components/GovernanceViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
export default async function Page({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const result = new GovernanceService().workflow(workflowId);
  if (!result.workflow) notFound();
  return (
    <WorkspaceContent >
      <GovernanceHeader
        title={result.workflow.name}
        description={result.workflow.description}
      />
      <GovernanceNav />
      <WorkflowDetail item={result.workflow} audit={result.audit} />
    </WorkspaceContent>
  );
}
