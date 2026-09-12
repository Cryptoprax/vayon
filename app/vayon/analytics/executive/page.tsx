import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { AnalyticsHeader } from "@/features/vayon/analytics-platform/components/AnalyticsViews";
import { ExecutiveBI } from "@/features/vayon/analytics-platform/components/ExecutiveBI";
import { AnalyticsService } from "@/features/vayon/analytics-platform/services/analytics.service";
import { ExecutiveAIService } from "@/features/platform/executive-ai";

export default async function Page() {
  const analytics = await AnalyticsService.production();
  const [data, ai] = await Promise.all([analytics.executiveBI(), ExecutiveAIService.production().then((service) => service.dashboard())]);
  return <WorkspaceContent ><AnalyticsHeader title="Executive Command Center" description="Measured business intelligence and clearly labeled AI recommendations, sourced only from this tenant's authoritative repositories."/><div className="mt-7"><ExecutiveBI data={data} ai={ai}/></div></WorkspaceContent>;
}
