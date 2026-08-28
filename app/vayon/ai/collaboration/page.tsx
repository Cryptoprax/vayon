import {
  AICollaborationService,
} from "@/features/platform/ai-collaboration";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { TeamCollaborationCenter } from "@/features/platform/ai-collaboration/components/TeamCollaborationCenter";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
export default async function Page() {
  const [data,user] = await Promise.all([(await AICollaborationService.production()).dashboard(),new AuthenticationService().user()]);
  const userName=String(user?.user_metadata?.full_name??user?.user_metadata?.name??user?.email?.split("@")[0]??"Executive").split(" ")[0];
  return (
    <WorkforceShell
      title="Team Collaboration"
      description="The command center for evidence-backed teamwork, transparent recommendations and governed approvals."
    >
      <TeamCollaborationCenter data={data} userName={userName}/>
    </WorkforceShell>
  );
}
