import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { AnalyticsHeader } from "@/features/vayon/analytics-platform/components/AnalyticsViews";
import { ExecutiveBI } from "@/features/vayon/analytics-platform/components/ExecutiveBI";
import { AnalyticsService } from "@/features/vayon/analytics-platform/services/analytics.service";
import { ExecutiveAIService } from "@/features/platform/executive-ai";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";

export const dynamic = "force-dynamic";
export default async function Page() {
  try {
    await requireEntitlement("advanced_analytics");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="advanced_analytics" label="Executive Command Center" />;
    throw error;
  }
  const analytics = await AnalyticsService.production();
  const [data, ai] = await Promise.all([analytics.executiveBI(), ExecutiveAIService.production().then((service) => service.dashboard())]);
  return <WorkspaceContent ><AnalyticsHeader title="Executive Command Center" description="Measured business intelligence and clearly labeled AI recommendations, sourced only from this tenant's authoritative repositories."/><div className="mt-7"><ExecutiveBI data={data} ai={ai}/></div></WorkspaceContent>;
}
