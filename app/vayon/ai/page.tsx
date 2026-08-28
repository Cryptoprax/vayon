import { CommandCenter } from "@/features/vayon/operational-workforce/components/WorkforceViews";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
export default async function Page() {
  const snapshot = await (await WorkforceService.production()).snapshot();
  return (
    <WorkforceShell
      title="Meet Your AI Team"
      description="See workloads, team health, today’s productivity, current priorities, suggested actions and upcoming deadlines in one place."
    >
      <CommandCenter snapshot={snapshot} />
    </WorkforceShell>
  );
}
