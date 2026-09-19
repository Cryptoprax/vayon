import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { AIHeader, ProviderHealth } from "@/features/vayon/ai-workforce/components/AIWorkforceUI";
import { WorkforceDirectory } from "@/features/vayon/operational-workforce/components/WorkforceDirectory";
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
  const health = snapshot.runtimeHealth;
  return <WorkspaceContent >
    <AIHeader title="Meet Your AI Team" description="Your AI real estate specialists are prepared for sales, property consulting, marketing, customer success and operations. Every important action stays under your control." health={health}/>
    <details className="mt-5 rounded-2xl border border-vds-border bg-vds-surface p-4"><summary className="cursor-pointer text-sm font-medium">Advanced AI status</summary><div className="mt-4"><ProviderHealth health={health} observability={snapshot.observability}/></div></details>
    <div className="mt-7"><WorkforceDirectory items={snapshot.employees}/></div>
  </WorkspaceContent>;
}
