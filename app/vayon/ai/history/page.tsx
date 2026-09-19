import { ActivityList } from "@/features/vayon/operational-workforce/components/WorkforceViews";
import { WorkforceShell } from "@/features/vayon/operational-workforce/components/WorkforceShell";
import { WorkforceService } from "@/features/vayon/operational-workforce/services/workforce.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
export const dynamic = "force-dynamic";
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
      title="Workforce History"
      description="A read-only timeline of governed workforce outcomes derived from existing workspace tasks and conversations."
    >
      <ActivityList items={snapshot.activity} />
    </WorkforceShell>
  );
}
