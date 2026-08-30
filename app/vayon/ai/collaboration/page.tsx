import {
  AICollaborationService,
} from "@/features/platform/ai-collaboration";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { AICompanyOrchestrationCenter } from "@/features/platform/ai-collaboration/components/AICompanyOrchestrationCenter";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
import { ExecutiveCollaborationBoard } from "@/features/platform/ai-collaboration/components/ExecutiveCollaborationBoard";
export default async function Page() {
  const [data,workforce,user] = await Promise.all([(await AICollaborationService.production()).dashboard(),(await WorkforceService.production()).snapshot(),new AuthenticationService().user()]);
  const userName=String(user?.user_metadata?.full_name??user?.user_metadata?.name??user?.email?.split("@")[0]??"Executive").split(" ")[0];
  return (
    <WorkforceShell
      title="AI Company Orchestration Center"
      description="The executive boardroom for coordinated, evidence-backed recommendations and governed Founder decisions."
    >
      <ExecutiveCollaborationBoard data={data} workforce={workforce}/>
      <AICompanyOrchestrationCenter data={data} workforce={workforce} userName={userName}/>
    </WorkforceShell>
  );
}
