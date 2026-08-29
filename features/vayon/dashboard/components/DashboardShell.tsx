import { ButtonLink } from "@/features/platform/design-system";
import { BarChart3, Bot } from "lucide-react";
import type { ExecutiveDashboardData } from "../types";
import { ActivityTimeline } from "./ActivityTimeline";
import { AICommandBar } from "./AICommandBar";
import { AIWorkforceGrid } from "./AIWorkforceGrid";
import { CalendarWidget } from "./CalendarWidget";
import { PipelineBoard } from "./PipelineBoard";
import { QuickActions } from "./QuickActions";
import { RevenueChartLoader } from "./RevenueChartLoader";
import { WhatsAppConversations } from "./WhatsAppConversations";
import { ExecutiveCommandCenter } from "./ExecutiveCommandCenter";
import { RealEstateKpiGrid } from "./RealEstateKpiGrid";

export function DashboardShell({
  data,
  onBlockedAction,
  aiPrompts,
  userName = "Executive",
}: {
  readonly data: ExecutiveDashboardData;
  readonly onBlockedAction?: () => void;
  readonly aiPrompts?: readonly string[];
  readonly userName?: string;
}) {
  return (
    <div className="mx-auto max-w-[100rem] space-y-6 px-4 py-7 sm:px-6 sm:py-9">
      <ExecutiveCommandCenter data={data} userName={userName} />
      <AICommandBar onBlockedAction={onBlockedAction} prompts={aiPrompts} />
      {data.isEmpty && <EmptyDashboard />}
      <RealEstateKpiGrid data={data} />
      <div className="grid gap-5 2xl:grid-cols-[1.15fr_.85fr]">
        <RevenueChartLoader data={data.charts} currency={data.currency} />
        <CalendarWidget items={data.calendar} />
      </div>
      <PipelineBoard
        items={data.pipeline.filter((item) => item.id !== "lost")}
        currency={data.currency}
      />
      <AIWorkforceGrid members={data.aiWorkforce} />
      <div className="grid gap-5 xl:grid-cols-2">
        <ActivityTimeline items={data.activities} />
        <WhatsAppConversations conversations={data.whatsappConversations} />
      </div>
      <QuickActions />
    </div>
  );
}

function EmptyDashboard() {
  return (
    <section className="rounded-3xl border border-dashed border-vds-border bg-vds-surface p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Your executive workspace is ready</h2>
            <p className="mt-2 max-w-xl text-sm text-vds-muted">
              Add your first lead, property, or transaction. Dashboard metrics will
              populate from verified workspace records.
            </p>
          </div>
        </div>
        <ButtonLink href="/vayon/leads/new" className="shrink-0">
          <Bot className="size-4" /> Create first lead
        </ButtonLink>
      </div>
    </section>
  );
}
