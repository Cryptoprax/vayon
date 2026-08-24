import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleGauge,
  ListTodo,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import { FounderRealtime } from "@/features/platform/founder/components/FounderRealtime";
import { FounderReportExports } from "@/features/platform/founder/components/FounderReportExports";
import type { AutonomousOperationsSnapshot } from "../services/autonomous-operations.service";
import { OperationsWorkbench } from "./OperationsWorkbench";

const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/70 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";

export function AutonomousOperationsDashboard({
  data,
  history,
  health,
}: {
  data: AutonomousOperationsSnapshot;
  history: ConversationSnapshot;
  health: OpenAIHealth;
}) {
  const mrr =
      data.hub.executive.founder.kpis.find((item) => item.id === "mrr")
        ?.value ?? null,
    risks = data.priorities.filter((item) => item.kind === "risk"),
    explainability = {
      evidence: data.context.retrieval.evidence.length,
      entities: data.context.retrieval.relevantEntities.length,
      confidence: data.context.retrieval.confidence,
      sources: data.context.retrieval.memorySources,
      timestamp: data.context.retrieval.generatedAt,
    };
  return (
    <main className="relative mx-auto max-w-[120rem] space-y-8 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_12%_8%,var(--vds-color-primary-soft),transparent_36%),radial-gradient(circle_at_84%_12%,var(--vds-color-info-soft),transparent_30%)]"
        aria-hidden="true"
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-vds-primary">
            <Sparkles className="size-4" aria-hidden="true" /> Founder Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            Autonomous Business Operations Center
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-vds-muted sm:text-base">
            Founder AI continuously monitors authorized business evidence,
            coordinates governed AI tasks, and prepares actions for explicit
            Founder approval. No autonomous production writes occur here.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FounderRealtime />
          <time className="text-xs text-vds-subtle" dateTime={data.generatedAt}>
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </time>
        </div>
      </header>

      <section aria-labelledby="operations-status">
        <Heading
          icon={CircleGauge}
          id="operations-status"
          title="Autonomous operations dashboard"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {data.statuses.map((item, index) => (
            <article
              className={`${card} min-h-36 p-5 transition hover:-translate-y-0.5 motion-safe:animate-[fade-in_.45s_ease-out_both]`}
              style={{ animationDelay: `${index * 35}ms` }}
              key={item.name}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium">{item.name} Status</h2>
                <span
                  aria-label={item.state}
                  className={`size-2.5 rounded-full ${stateColor(item.state)}`}
                />
              </div>
              <p className="mt-5 text-2xl font-semibold">
                {item.value === null
                  ? "Unavailable"
                  : `${Math.round(item.value)}%`}
              </p>
              <p className="mt-2 text-xs leading-5 text-vds-muted">
                {item.reason}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="business-objectives">
        <Heading
          icon={Target}
          id="business-objectives"
          title="Business objectives"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.objectives.map((item) => (
            <article className={`${card} p-5`} key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{item.title}</h3>
                <span className="text-sm font-semibold text-vds-primary">
                  {item.progress === null
                    ? "Unavailable"
                    : `${Math.round(item.progress)}%`}
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-vds-elevated">
                <div
                  className="h-full rounded-full bg-vds-primary"
                  style={{
                    width: `${Math.max(0, Math.min(100, item.progress ?? 0))}%`,
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-vds-muted">
                Responsible: {item.modules.join(" · ")}
              </p>
              <p className="mt-2 text-xs text-vds-subtle">
                Workflows:{" "}
                {item.relatedWorkflows.join(" · ") || "None configured"}
              </p>
              <p className="mt-3 text-xs leading-5 text-vds-muted">
                Evidence: {item.evidence}
              </p>
            </article>
          ))}
        </div>
      </section>

      <OperationsWorkbench baseMrr={mrr} />

      <section aria-labelledby="ai-task-coordination">
        <Heading
          icon={Bot}
          id="ai-task-coordination"
          title="AI task coordination"
        />
        <div className={`${card} mt-4 overflow-x-auto`}>
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">
              Governed AI task execution status
            </caption>
            <thead>
              <tr className="border-b border-vds-border text-xs uppercase text-vds-subtle">
                {["Task", "AI module", "Status", "Progress", "Evidence"].map(
                  (label) => (
                    <th
                      className="px-4 py-4 font-medium"
                      scope="col"
                      key={label}
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((item) => (
                <tr
                  className="border-b border-vds-border/50 last:border-0"
                  key={item.id}
                >
                  <th className="px-4 py-4 font-medium" scope="row">
                    {item.title}
                  </th>
                  <td className="px-4 py-4 text-vds-muted">{item.agent}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-vds-border px-2 py-1 text-xs">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{item.progress}%</td>
                  <td className="max-w-sm px-4 py-4 text-xs text-vds-muted">
                    {item.evidence}
                  </td>
                </tr>
              ))}
              {!data.tasks.length && (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-vds-muted"
                    colSpan={5}
                  >
                    No authorized AI workflow tasks are queued.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="priority-queue">
          <Heading
            icon={ListTodo}
            id="priority-queue"
            title="Executive priority queue"
          />
          <div className={`${card} mt-4 space-y-3 p-5`}>
            {data.priorities.slice(0, 10).map((item, index) => (
              <article
                className="rounded-2xl border border-vds-border bg-vds-elevated/60 p-4"
                key={item.id}
              >
                <div className="flex justify-between gap-3">
                  <h3 className="text-sm font-medium">
                    {index + 1}. {item.title}
                  </h3>
                  <span className="text-xs uppercase text-vds-primary">
                    Impact {item.impact}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-vds-muted">
                  {item.evidence}
                </p>
                <p className="mt-2 text-[10px] uppercase text-vds-subtle">
                  Confidence {Math.round(item.confidence * 100)}% · {item.kind}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section aria-labelledby="risk-center">
          <Heading
            icon={AlertTriangle}
            id="risk-center"
            title="Business risk center"
          />
          <div className={`${card} mt-4 space-y-3 p-5`}>
            {risks.map((item) => (
              <article
                className="rounded-2xl border border-vds-warning/30 bg-vds-warning-soft p-4"
                key={item.id}
              >
                <div className="flex justify-between gap-3">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <span className="text-xs font-semibold">{item.impact}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-vds-muted">
                  Supporting evidence: {item.evidence}
                </p>
                <p className="mt-2 text-[10px] uppercase text-vds-subtle">
                  Evidence-backed risk · confidence{" "}
                  {Math.round(item.confidence * 100)}%
                </p>
              </article>
            ))}
            {!risks.length && (
              <p className="py-12 text-center text-sm text-vds-muted">
                No evidence-backed risks are currently available.
              </p>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="action-center">
        <Heading icon={CheckCircle2} id="action-center" title="Action center" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.actions.map((item) => (
            <article className={`${card} p-5`} key={item.id}>
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-vds-muted">
                {item.reason}
              </p>
              <p className="mt-2 text-xs text-vds-subtle">
                Evidence: {item.evidence}
              </p>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.12em] text-vds-warning">
                Explicit Founder approval required
              </p>
              <Link
                className="mt-3 inline-flex items-center gap-1 text-xs text-vds-primary"
                href="/vayon/approvals"
              >
                Review in approval center{" "}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="founder-ai-control">
        <Heading
          icon={Bot}
          id="founder-ai-control"
          title="Founder AI control tower"
        />
        <div className="mt-4">
          <WorkforceChatPanel
            employee="executive-ai"
            initial={history}
            health={health}
            initialPrompt="Summarize today's operating priorities, evidence-backed risks, and actions requiring my approval."
            explainability={explainability}
          />
        </div>
      </section>

      <section aria-labelledby="executive-digest">
        <Heading
          icon={Activity}
          id="executive-digest"
          title="Executive digest"
        />
        <div className="mt-4">
          <FounderReportExports
            title="Autonomous Business Operations Center"
            generatedAt={data.generatedAt}
            kpis={data.hub.executive.reportKpis}
            reports={data.digests}
          />
        </div>
      </section>

      <section className={`${card} p-5`} aria-labelledby="governance">
        <Heading
          icon={ShieldCheck}
          id="governance"
          title="Governance and evidence"
        />
        <p className="mt-3 text-sm leading-6 text-vds-muted">
          All views are Founder-only and tenant-scoped. AI outputs are
          recommendations, simulations never write production data, sensitive
          actions require approval, and unavailable evidence is shown explicitly
          rather than fabricated.
        </p>
      </section>
    </main>
  );
}

function Heading({
  icon: Icon,
  id,
  title,
}: {
  icon: typeof Sparkles;
  id: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-vds-primary" aria-hidden="true" />
      <h2 className="text-lg font-semibold" id={id}>
        {title}
      </h2>
    </div>
  );
}

function stateColor(state: "healthy" | "warning" | "risk" | "unavailable") {
  if (state === "healthy") return "bg-vds-success";
  if (state === "warning") return "bg-vds-warning";
  if (state === "risk") return "bg-vds-danger";
  return "bg-vds-subtle";
}
