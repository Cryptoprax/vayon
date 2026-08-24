import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  ChartNoAxesCombined,
  Clock3,
  Route,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { FounderRealtime } from "@/features/platform/founder/components/FounderRealtime";
import { FounderReportExports } from "@/features/platform/founder/components/FounderReportExports";
import { LazyFounderCharts } from "@/features/platform/founder/components/LazyFounderCharts";
import type {
  FounderChart,
  FounderKpi,
} from "@/features/platform/founder/types";
import { DealBoard } from "@/features/vayon/deal/components/DealBoard";
import type { DealBoardData } from "@/features/vayon/deal/types";
import type { SalesAIDashboard } from "@/features/platform/sales-ai/types";
import type { SalesDirectorSnapshot } from "../types";

const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/70 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function SalesDirectorDashboard({
  data,
  intelligence,
  pipeline,
  history,
  health,
  question,
}: {
  data: SalesDirectorSnapshot;
  intelligence: SalesAIDashboard | null;
  pipeline: DealBoardData | null;
  history: ConversationSnapshot;
  health: OpenAIHealth;
  question: string;
}) {
  return (
    <main className="relative mx-auto max-w-[120rem] space-y-8 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_8%,var(--vds-color-primary-soft),transparent_35%),radial-gradient(circle_at_82%_14%,var(--vds-color-info-soft),transparent_28%)]"
        aria-hidden="true"
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-vds-primary">
            <Route className="size-4" aria-hidden="true" />
            Founder Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            AI Sales Director
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">
            Revenue, pipeline execution, evidence-based lead intelligence,
            customer activity, governed follow-ups, and Sales AI guidance.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FounderRealtime />
          <Link className="text-xs text-vds-primary" href="/platform/founder">
            ← Founder Operating System
          </Link>
        </div>
      </header>
      <section>
        <h2 className="sr-only">Executive sales KPIs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {data.kpis.map((item, index) => (
            <Kpi item={item} index={index} key={item.id} />
          ))}
        </div>
      </section>
      <section>
        <Heading icon={ChartNoAxesCombined} title="Revenue and sales trends" />
        <LazyFounderCharts charts={charts(data)} />
      </section>
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Heading icon={Route} title="Sales pipeline" />
          <Link
            href="/vayon/deals/pipeline"
            className="inline-flex items-center gap-1 text-sm text-vds-primary"
          >
            Open full pipeline <ArrowUpRight className="size-4" />
          </Link>
        </div>
        {pipeline ? (
          <DealBoard data={pipeline} />
        ) : (
          <Empty message="Select an authorized organization and workspace to load the tenant-scoped drag-and-drop pipeline." />
        )}
      </section>
      <section>
        <Heading icon={Sparkles} title="AI lead scoring" />
        {intelligence ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {intelligence.leads.slice(0, 9).map((lead) => (
              <article className={`${card} p-5`} key={lead.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{lead.name}</h3>
                    <p className="mt-1 text-xs capitalize text-vds-muted">
                      {lead.temperature} priority
                    </p>
                  </div>
                  <span className="rounded-full border border-vds-border px-2 py-1 text-xs">
                    {Math.round(lead.confidence * 100)}% confidence
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Score label="Purchase probability" value={lead.confidence} />
                  <Score
                    label="Budget fit"
                    value={lead.value > 0 ? 0.8 : 0.2}
                  />
                  <Score
                    label="Engagement score"
                    value={lead.lastActivity ? 0.75 : 0.2}
                  />
                  <Score
                    label="Buying intent"
                    value={
                      lead.temperature === "hot"
                        ? 0.9
                        : lead.temperature === "warm"
                          ? 0.6
                          : 0.3
                    }
                  />
                  <Score
                    label="Follow-up urgency"
                    value={lead.temperature === "hot" ? 0.95 : 0.55}
                  />
                  <div>
                    <dt className="text-vds-subtle">
                      Preferred property profile
                    </dt>
                    <dd className="mt-1 text-vds-muted">
                      Available in CRM profile
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-5 text-vds-muted">
                  {lead.explanation}
                </p>
                <Link
                  className="mt-3 inline-flex items-center gap-1 text-xs text-vds-primary"
                  href={`/vayon/leads/${lead.id}`}
                >
                  Review priority recommendation{" "}
                  <ArrowUpRight className="size-3" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <Empty message="Sales AI evidence is unavailable for the active workspace. No lead score has been fabricated." />
        )}
      </section>
      <section>
        <Heading icon={Bot} title="AI Sales Copilot" />
        <div className={`${card} my-4 p-5`}>
          <form method="get">
            <label className="text-sm font-medium" htmlFor="sales-question">
              Ask about leads, deals, pipeline, forecasts, team performance, or
              conversion trends
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-11 flex-1 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
                id="sales-question"
                name="question"
                defaultValue={question}
                maxLength={1000}
                placeholder="Where is pipeline risk increasing?"
              />
              <Button type="submit">
                Prepare context
              </Button>
            </div>
          </form>
        </div>
        <WorkforceChatPanel
          employee="sales-ai"
          initial={history}
          health={health}
          initialPrompt={
            question
              ? `Answer this founder sales question using authoritative workspace evidence only: ${question}. Clearly label recommendations, cite unavailable evidence, and do not execute actions.`
              : ""
          }
        />
      </section>
      <section>
        <Heading icon={Activity} title="Customer timeline" />
        <div className={`${card} mt-4 p-5`}>
          <p className="mb-4 text-xs text-vds-muted">
            Unified, read-only activity evidence includes marketing attribution,
            calls, emails, meetings, site visits, documents, proposals, and
            payments when recorded.
          </p>
          <ol className="space-y-4">
            {data.timeline.slice(0, 20).map((item) => (
              <li className="border-l border-vds-primary pl-4" key={item.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <time className="text-xs text-vds-subtle">
                    {new Date(item.occurredAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-xs text-vds-muted">
                  {item.category}
                  {item.detail ? ` · ${item.detail}` : ""}
                </p>
              </li>
            ))}
            {!data.timeline.length && (
              <li className="text-sm text-vds-muted">
                No authorized customer activity is available.
              </li>
            )}
          </ol>
        </div>
      </section>
      <section>
        <Heading icon={Workflow} title="Follow-up workflows" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {data.automations.map((item) => (
            <article className={`${card} p-5`} key={item.id}>
              <h3 className="font-medium">{item.name}</h3>
              <p className="mt-2 text-xs text-vds-muted">
                Trigger: {item.trigger}
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-[.12em] text-vds-primary">
                Consent aware · Approval required
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-1 text-xs text-vds-primary"
                href="/vayon/workflows"
              >
                Open workflow framework <ArrowUpRight className="size-3" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section>
        <Heading icon={Clock3} title="Sales reporting" />
        <div className="mt-4">
          <FounderReportExports
            title="AI Sales Director"
            generatedAt={data.generatedAt}
            kpis={data.kpis}
            reports={data.reports}
          />
        </div>
      </section>
    </main>
  );
}
function Kpi({ item, index }: { item: FounderKpi; index: number }) {
  return (
    <article
      className={`${card} min-h-32 p-4 transition hover:-translate-y-0.5 motion-safe:animate-[fade-in_.45s_ease-out_both]`}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <p className="text-[10px] uppercase tracking-[.13em] text-vds-subtle">
        {item.label}
      </p>
      <p className="mt-4 text-2xl font-semibold">
        {item.value === null
          ? "—"
          : `${item.unit === "currency" ? "$" : ""}${item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${item.unit === "percent" ? "%" : ""}`}
      </p>
      <p className="mt-2 text-[10px] uppercase text-vds-subtle">
        {item.status}
      </p>
    </article>
  );
}
function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-vds-subtle">{label}</dt>
      <dd className="mt-1 font-medium">{Math.round(value * 100)}%</dd>
    </div>
  );
}
function Heading({ icon: Icon, title }: { icon: typeof Route; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-vds-primary" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
function Empty({ message }: { message: string }) {
  return (
    <div className={`${card} mt-4 p-8 text-center text-sm text-vds-muted`}>
      {message}
    </div>
  );
}
function charts(data: SalesDirectorSnapshot): FounderChart[] {
  const keys = [
    "today_revenue",
    "monthly_revenue",
    "forecast_revenue",
    "pipeline_value",
    "new_leads",
    "qualified_leads",
    "won_deals",
    "conversion_rate",
    "sales_velocity",
  ];
  return keys.map((key) => ({
    id: key,
    label: key.replaceAll("_", " "),
    unit: data.metrics.find((row) => row.metric === key)?.unit ?? "count",
    points: data.metrics
      .filter((row) => row.metric === key)
      .slice(0, 12)
      .reverse()
      .map((row) => ({
        label: new Date(row.recordedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value: row.value,
      })),
  }));
}
