import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import {
  AnalyticsHeader,
  Insights,
  MetricGrid,
  PlatformHealth,
} from "../components/AnalyticsViews";
import type { AnalyticsDomain } from "../domain/models";
import { AnalyticsService } from "../services/analytics.service";
import { dataset, domainTitles } from "../view-models/analytics";
export async function AnalyticsRoute({
  domain,
  overview = false,
}: {
  domain: AnalyticsDomain;
  overview?: boolean;
}) {
  const service = await AnalyticsService.production(),
    snapshot = await service.snapshot();
  return (
    <WorkspaceContent >
      <AnalyticsHeader
        title={
          overview
            ? "Understand performance"
            : domainTitles[domain]
        }
        description="Review revenue, sales, and follow-up results to decide where your business needs attention. Figures appear when the required records are available."
      />
      <MetricGrid data={dataset(snapshot, domain)} />
      {(overview || domain === "executive") && (
        <Insights items={service.insights(snapshot)} />
      )}{" "}
      {overview && <details className="mt-6"><summary className="focus-ring cursor-pointer rounded-lg py-3 font-semibold">Review data connections</summary><PlatformHealth s={snapshot} /></details>}
    </WorkspaceContent>
  );
}
