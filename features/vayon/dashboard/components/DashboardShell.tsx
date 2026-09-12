import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import type { ExecutiveDashboardData } from "../types";
import { ActivityTimeline } from "./ActivityTimeline";
import { AIWorkforceGrid } from "./AIWorkforceGrid";
import { CalendarWidget } from "./CalendarWidget";
import { PipelineBoard } from "./PipelineBoard";
import { RevenueChartLoader } from "./RevenueChartLoader";
import { WhatsAppConversations } from "./WhatsAppConversations";
import { ExecutiveCommandCenter } from "./ExecutiveCommandCenter";
import { RealEstateKpiGrid } from "./RealEstateKpiGrid";
import { GettingStartedChecklist } from "./GettingStartedChecklist";

export function DashboardShell({
  data,
  userName = "Executive",
}: {
  readonly data: ExecutiveDashboardData;
  readonly onBlockedAction?: () => void;
  readonly aiPrompts?: readonly string[];
  readonly userName?: string;
}) {
  return (
    <WorkspaceContent >
      <ExecutiveCommandCenter data={data} userName={userName} />
      <GettingStartedChecklist data={data} />
      <RealEstateKpiGrid data={data} />
      <PipelineBoard items={data.pipeline} currency={data.currency} />
      <RevenueChartLoader data={data.charts} currency={data.currency} />
      <details className="rounded-2xl border border-vds-border bg-vds-surface p-5"><summary className="focus-ring cursor-pointer rounded-lg py-2 font-semibold">Review today&apos;s AI tasks</summary><div className="mt-4"><AIWorkforceGrid members={data.aiWorkforce} /></div></details>
      <div className="grid gap-5 xl:grid-cols-2">
        <CalendarWidget items={data.calendar} />
        <ActivityTimeline items={data.activities} linkedDestinations={["/vayon/analytics", "/vayon/deals", "/vayon/deals/new", "/vayon/properties", "/vayon/properties/new", "/vayon/leads/new", "/vayon/tasks", "/vayon/settings/members", "/vayon/settings/organization", "/vayon/whatsapp/settings", "/vayon/settings/integrations/data-import", "/vayon/approvals", "/vayon/calendar", "/vayon/communications", "/vayon/ai/work-queue", ...data.pipeline.map(item => item.href), ...data.aiWorkforce.map(member => `/vayon/ai/workforce/${member.id}`)]} />
        <WhatsAppConversations conversations={data.whatsappConversations} />
      </div>
    </WorkspaceContent>
  );
}
