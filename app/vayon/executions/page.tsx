import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import {
  ExecutionList,
  GovernanceHeader,
  GovernanceNav,
} from "@/features/vayon/workflow-approval/components/GovernanceViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
export default function Page() {
  const data = new GovernanceService().dashboard();
  return (
    <WorkspaceContent >
      <GovernanceHeader
        title="Execution Requests"
        description="Governed action proposals and their lifecycle. No adapter in this release can perform an external action."
      />
      <GovernanceNav />
      <ExecutionList items={data.executions} />
    </WorkspaceContent>
  );
}
