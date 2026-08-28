import { WorkforceDirectory } from "@/features/vayon/operational-workforce/components/WorkforceDirectory";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
import { ContextualSetupState } from "@/features/onboarding/components/ContextualSetupState";
export default async function Page() {
  const snapshot = await (await WorkforceService.production()).snapshot();
  return (
    <WorkforceShell
      title="Meet Your AI Team"
      description="Your real estate specialists are ready with visible workloads, verified activity and recommendations that stay under your control."
    >
      {snapshot.employees.length ? (
        <WorkforceDirectory items={snapshot.employees} />
      ) : (
        <ContextualSetupState
          title="Meet Your AI Team"
          description="Sarah is waiting for her first leads. Emma is waiting for properties. Alex is ready to launch your first campaign."
          estimatedTime="45 seconds"
          href="/onboarding?setup=ai-workforce"
          recommendations={["Sales Agent", "Marketing Agent", "Support Agent"]}
        />
      )}
    </WorkforceShell>
  );
}
