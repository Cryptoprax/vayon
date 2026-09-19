import { CommandCenter } from "@/features/vayon/operational-workforce/components/WorkforceViews";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
export default async function Page() {
  try {
    await requireEntitlement("ai_workforce");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="ai_workforce" label="AI Workforce" />;
    throw error;
  }
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
