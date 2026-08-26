import { WorkforceDirectory } from "@/features/vayon/operational-workforce/components/WorkforceDirectory";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
import { ContextualSetupState } from "@/features/onboarding/components/ContextualSetupState";
export default async function Page() {
  const snapshot = await (await WorkforceService.production()).snapshot();
  return (
    <WorkforceShell
      title="AI Workforce"
      description="A live directory of specialized digital employees with governed access, visible workload, workspace memory, and team collaboration."
    >
      {snapshot.employees.length ? (
        <WorkforceDirectory items={snapshot.employees} />
      ) : (
        <ContextualSetupState
          title="AI Workforce"
          description="Your AI Workforce hasn't been configured yet."
          estimatedTime="45 seconds"
          href="/onboarding?setup=ai-workforce"
          recommendations={["Sales Agent", "Marketing Agent", "Support Agent"]}
        />
      )}
    </WorkforceShell>
  );
}
