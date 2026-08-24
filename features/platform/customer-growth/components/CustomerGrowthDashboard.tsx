import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  ChartNoAxesCombined,
  HeartPulse,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { FounderRealtime } from "@/features/platform/founder/components/FounderRealtime";
import { FounderReportExports } from "@/features/platform/founder/components/FounderReportExports";
import { LazyFounderCharts } from "@/features/platform/founder/components/LazyFounderCharts";
import type {
  FounderChart,
  FounderKpi,
} from "@/features/platform/founder/types";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import { WorkforceChatPanel } from "@/features/platform/openai/runtime/ChatPanel";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import type { CustomerGrowthSnapshot, OrganizationHealth } from "../types";

const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/70 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function CustomerGrowthDashboard({
  data,
  history,
  health,
  question,
}: {
  data: CustomerGrowthSnapshot;
  history: ConversationSnapshot;
  health: OpenAIHealth;
  question: string;
}) {
  return (
    <main className="relative mx-auto max-w-[120rem] space-y-8 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_8%,var(--vds-color-primary-soft),transparent_35%),radial-gradient(circle_at_82%_14%,var(--vds-color-success-soft),transparent_28%)]"
        aria-hidden="true"
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-vds-primary">
            <TrendingUp className="size-4" aria-hidden="true" />
            Founder Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            AI Customer Success &amp; Growth Engine
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">
            Customer health, retention, renewals, expansion, adoption, and
            evidence-based success guidance from governed VAYON services.
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
        <h2 className="sr-only">Executive growth KPIs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {data.kpis.map((item, index) => (
            <Kpi item={item} index={index} key={item.id} />
          ))}
        </div>
      </section>
      <section>
        <Heading
          icon={ChartNoAxesCombined}
          title="Retention, adoption, and growth trends"
        />
        <div className="mt-4">
          <LazyFounderCharts charts={charts(data)} />
        </div>
      </section>
      <section>
        <Heading icon={HeartPulse} title="Customer health engine" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.organizations.map((organization) => (
            <HealthCard item={organization} key={organization.id} />
          ))}
          {!data.organizations.length && (
            <Empty message="No authorized organization health evidence is available." />
          )}
        </div>
      </section>
      <section>
        <Heading icon={RefreshCw} title="Renewal center" />
        <div className={`${card} mt-4 overflow-x-auto`}>
          <table className="w-full min-w-[58rem] text-left text-sm">
            <caption className="sr-only">
              Upcoming, failed, and successful customer renewals
            </caption>
            <thead>
              <tr className="border-b border-vds-border text-xs uppercase tracking-[.1em] text-vds-subtle">
                {[
                  "Organization",
                  "Status",
                  "Renewal",
                  "Auto-renew",
                  "Outstanding invoices",
                  "Recommendation",
                ].map((label) => (
                  <th className="px-4 py-4" scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.renewals.map((item) => (
                <tr
                  className="border-b border-vds-border/50 last:border-0"
                  key={item.id}
                >
                  <td className="px-4 py-4 font-medium">
                    {item.organizationId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-4 capitalize">{item.status}</td>
                  <td className="px-4 py-4 text-vds-muted">
                    {item.renewsAt
                      ? new Date(item.renewsAt).toLocaleDateString()
                      : "Unavailable"}
                  </td>
                  <td className="px-4 py-4">
                    {item.autoRenew ? "Enabled" : "Disabled"}
                  </td>
                  <td className="px-4 py-4">{item.outstandingInvoices}</td>
                  <td className="max-w-md px-4 py-4 text-vds-muted">
                    {item.recommendation}
                  </td>
                </tr>
              ))}
              {!data.renewals.length && (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-vds-muted"
                    colSpan={6}
                  >
                    No subscription renewal evidence is available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <Heading icon={Sparkles} title="Expansion opportunities" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.organizations
            .filter((item) => item.expansionOpportunities.length)
            .sort((a, b) => b.score - a.score)
            .slice(0, 12)
            .map((item) => (
              <article className={`${card} p-5`} key={item.id}>
                <div className="flex justify-between gap-3">
                  <h3 className="font-medium">{item.name}</h3>
                  <span className="text-xs text-vds-success">
                    {item.score}/100
                  </span>
                </div>
                <p className="mt-2 text-xs text-vds-muted">
                  Expected value:{" "}
                  {item.expectedExpansionValue === null
                    ? "Unavailable"
                    : item.expectedExpansionValue.toLocaleString()}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {item.expansionOpportunities.map((opportunity) => (
                    <li key={opportunity}>• {opportunity}</li>
                  ))}
                </ul>
                <Link
                  className="mt-4 inline-flex items-center gap-1 text-xs text-vds-primary"
                  href={`/platform/customers/${item.id}`}
                >
                  Review account evidence <ArrowUpRight className="size-3" />
                </Link>
              </article>
            ))}
        </div>
      </section>
      <section>
        <Heading icon={Activity} title="Customer journey" />
        <div className={`${card} mt-4 p-5`}>
          <p className="mb-5 text-xs text-vds-muted">
            Unified lifecycle evidence covers first website visit, trial,
            product and feature adoption, AI interactions, billing, support,
            marketing, sales, and renewals when recorded.
          </p>
          <ol className="space-y-4">
            {data.journey.slice(0, 30).map((item) => (
              <li className="border-l border-vds-primary pl-4" key={item.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <time className="text-xs text-vds-subtle">
                    {new Date(item.occurredAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-xs text-vds-muted">
                  {item.category} · Organization{" "}
                  {item.organizationId?.slice(0, 8) ?? "not attributed"}
                </p>
              </li>
            ))}
            {!data.journey.length && (
              <li className="text-sm text-vds-muted">
                No authorized journey evidence is available.
              </li>
            )}
          </ol>
        </div>
      </section>
      <section>
        <Heading icon={Bot} title="AI Customer Success Copilot" />
        <div className={`${card} my-4 p-5`}>
          <form method="get">
            <label className="text-sm font-medium" htmlFor="growth-question">
              Ask which customers may churn, need contact or onboarding, or are
              ready for Enterprise
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-11 flex-1 rounded-xl border border-vds-border bg-vds-input px-3 text-sm"
                id="growth-question"
                name="question"
                defaultValue={question}
                maxLength={1000}
                placeholder="Which organizations should we contact today?"
              />
              <Button type="submit">Prepare context</Button>
            </div>
          </form>
        </div>
        <WorkforceChatPanel
          employee="executive-ai"
          initial={history}
          health={health}
          initialPrompt={
            question
            ? `Act as the Founder Customer Success Copilot. Answer using authoritative customer health, adoption, billing, support, and journey evidence only: ${question}. Clearly label recommendations and unavailable evidence. Do not execute actions or contact customers.`
              : ""
          }
        />
      </section>
      <section>
        <Heading icon={Workflow} title="Customer success automation" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {data.automations.map((item) => (
            <article className={`${card} p-5`} key={item.id}>
              <h3 className="font-medium">{item.name}</h3>
              <p className="mt-2 text-xs text-vds-muted">
                Trigger: {item.trigger}
              </p>
              <p className="mt-4 text-[10px] uppercase leading-5 tracking-[.1em] text-vds-primary">
                Consent required · Unsubscribe enforced · Approval required
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
        <Heading
          icon={ChartNoAxesCombined}
          title="Customer success reporting"
        />
        <div className="mt-4">
          <FounderReportExports
            title="AI Customer Success & Growth Engine"
            generatedAt={data.generatedAt}
            kpis={data.kpis}
            reports={data.reports}
          />
        </div>
      </section>
    </main>
  );
}
function HealthCard({ item }: { item: OrganizationHealth }) {
  const tone =
    item.classification === "Healthy"
      ? "text-vds-success"
      : item.classification === "Needs Attention"
        ? "text-vds-warning"
        : "text-vds-danger";
  return (
    <article className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{item.name}</h3>
          <p className="mt-1 text-xs text-vds-muted">{item.plan}</p>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${tone}`}>{item.classification}</p>
          <p className="text-xs text-vds-subtle">
            {item.score}/100 · {Math.round(item.confidence * 100)}% confidence
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-vds-elevated">
        <span
          className="block h-full rounded-full bg-vds-primary"
          style={{ width: `${item.score}%` }}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium">Churn prediction</p>
          <p className="mt-1 text-lg font-semibold">
            {Math.round(item.churnProbability * 100)}%
          </p>
          <ul className="mt-2 space-y-1 text-xs text-vds-muted">
            {item.riskFactors.slice(0, 3).map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium">Recommended actions</p>
          <ul className="mt-2 space-y-1 text-xs text-vds-muted">
            {item.recommendedActions.slice(0, 3).map((action) => (
              <li key={action}>• {action}</li>
            ))}
          </ul>
        </div>
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-vds-primary">
          Health evidence
        </summary>
        <ul className="mt-2 space-y-1 text-vds-muted">
          {item.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      </details>
    </article>
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
function Heading({
  icon: Icon,
  title,
}: {
  icon: typeof TrendingUp;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-vds-primary" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
function Empty({ message }: { message: string }) {
  return (
    <div className={`${card} p-8 text-center text-sm text-vds-muted`}>
      {message}
    </div>
  );
}
function charts(data: CustomerGrowthSnapshot): FounderChart[] {
  const keys = [
    "trial_conversion",
    "active_customers",
    "renewals_completed",
    "expansion_revenue",
    "customer_health",
    "churn_risk",
    "net_revenue_retention",
    "gross_revenue_retention",
    "product_adoption",
    "feature_adoption",
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
