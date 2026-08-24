import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Building2,
  CircleDollarSign,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { FounderKpi, FounderSnapshot } from "../types";
import { FounderRealtime } from "./FounderRealtime";
import { LazyFounderCharts } from "./LazyFounderCharts";

const card =
  "rounded-3xl border border-vds-border/70 bg-vds-surface/70 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
const actions = [
  ["Founder Access", "/platform/founder/access"],
  ["Enterprise Tenant Management", "/platform/founder/tenants"],
  ["VAYON AI Command Center", "/platform/founder/command-center"],
  ["Autonomous Operations Center", "/platform/founder/operations"],
  ["Unified AI Memory", "/platform/founder/memory"],
  ["Workflow & AI Orchestration", "/platform/founder/workflows"],
  ["Enterprise Integration Hub", "/platform/founder/integrations"],
  ["Platform Observability", "/platform/founder/observability"],
  ["AI Creative Runtime", "/vayon/creative/runtime"],
  ["Creative Execution Engine", "/vayon/creative/runtime/execution"],
  ["Creative Cloud Architecture", "/vayon/creative/cloud"],
  ["Platform Intelligence Hub", "/platform/founder/intelligence"],
  ["Founder AI", "/platform/founder/ai"],
  ["Customer Success & Growth", "/platform/founder/customer-success"],
  ["AI Sales Director", "/platform/founder/sales"],
  ["AI Marketing Director", "/platform/founder/marketing"],
  ["Launch Campaign", "/vayon/creative-studio/wizard"],
  ["Create Organization", "/platform/organizations"],
  ["Invite Customer", "/platform/customers"],
  ["Broadcast Email", "/vayon/settings/email"],
  ["Broadcast WhatsApp", "/vayon/whatsapp"],
  ["Open Marketing Studio", "/vayon/creative-studio"],
  ["Open Creative Studio", "/vayon/creative"],
  ["Open Growth Studio", "/vayon/growth"],
  ["Open AI Workforce", "/vayon/ai/workforce"],
] as const;

export function FounderDashboard({ data }: { data: FounderSnapshot }) {
  return (
    <main className="relative mx-auto w-full max-w-[120rem] space-y-8 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_20%_10%,var(--vds-color-primary-soft),transparent_36%),radial-gradient(circle_at_85%_15%,var(--vds-color-info-soft),transparent_28%)]"
        aria-hidden="true"
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.22em] text-vds-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Founder Portal
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            Founder Operating System
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">
            Company-wide revenue, growth, customers, AI, operations, security,
            and platform health—measured from authoritative VAYON services.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <FounderRealtime />
          <time className="text-xs text-vds-subtle" dateTime={data.generatedAt}>
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </time>
        </div>
      </header>
      <section aria-labelledby="founder-kpis">
        <h2 className="sr-only" id="founder-kpis">
          Executive key performance indicators
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {data.kpis.map((item, index) => (
            <KpiCard item={item} index={index} key={item.id} />
          ))}
        </div>
      </section>
      <div className="grid gap-6 2xl:grid-cols-[1.55fr_.85fr]">
        <section aria-labelledby="analytics-title">
          <SectionHeading
            icon={Activity}
            title="Founder analytics"
            detail="Revenue, growth, usage and retention"
          />
          <LazyFounderCharts charts={data.charts} />
        </section>
        <section aria-labelledby="activity-title">
          <SectionHeading
            icon={Activity}
            title="Realtime activity"
            detail="Live company events"
          />
          <div className={`${card} max-h-[44rem] overflow-y-auto p-5`}>
            <ol className="relative space-y-1">
              {data.activity.map((item) => (
                <li
                  className="grid grid-cols-[1rem_1fr] gap-3 border-b border-vds-border/50 py-3 last:border-0"
                  key={item.id}
                >
                  <span className="mt-1.5 size-2 rounded-full bg-vds-primary shadow-[0_0_12px_var(--vds-color-primary)]" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs capitalize text-vds-subtle">
                      {item.kind} · {new Date(item.occurredAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
              {!data.activity.length && (
                <li className="py-14 text-center text-sm text-vds-muted">
                  No authorized activity is available.
                </li>
              )}
            </ol>
          </div>
        </section>
      </div>
      <section>
        <SectionHeading
          icon={Megaphone}
          title="Marketing overview"
          detail="Provider-ready channel intelligence"
        />
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[70rem] text-left text-sm">
            <caption className="sr-only">Marketing channel performance</caption>
            <thead>
              <tr className="border-b border-vds-border text-xs uppercase tracking-[.1em] text-vds-subtle">
                {[
                  "Channel",
                  "Spend",
                  "Revenue",
                  "ROAS",
                  "ROI",
                  "Clicks",
                  "CTR",
                  "Conversions",
                  "Cost / lead",
                  "Cost / customer",
                ].map((label) => (
                  <th className="px-4 py-4 font-medium" scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.marketing.map((item) => (
                <tr
                  className="border-b border-vds-border/50 last:border-0"
                  key={item.channel}
                >
                  <th className="px-4 py-4 font-medium" scope="row">
                    {item.channel}
                  </th>
                  {[
                    item.spend,
                    item.revenue,
                    item.roas,
                    item.roi,
                    item.clicks,
                    item.ctr,
                    item.conversions,
                    item.costPerLead,
                    item.costPerCustomer,
                  ].map((value, index) => (
                    <td className="px-4 py-4 text-vds-muted" key={index}>
                      {value === null
                        ? "Unavailable"
                        : value.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <SectionHeading
          icon={CircleDollarSign}
          title="Sales overview"
          detail="Pipeline and commercial performance"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {data.sales.map((item, index) => (
            <KpiCard item={item} index={index} key={item.id} />
          ))}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <SectionHeading
            icon={Bot}
            title="Founder AI"
            detail="Generated insights · recommendation only"
          />
          <div className={`${card} p-5`}>
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                "Daily Brief",
                "Morning Summary",
                "Business Insights",
                "Revenue Forecast",
                "Risk Detection",
                "Growth Suggestions",
                "Cashflow Alerts",
              ].map((label) => (
                <span
                  className="rounded-full border border-vds-accent-border bg-vds-primary-soft px-3 py-1.5 text-xs text-vds-primary"
                  key={label}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.insights.map((item) => (
                <article
                  className="rounded-2xl border border-vds-border bg-vds-elevated/70 p-4"
                  key={item.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{item.title}</h3>
                    <span className="text-[10px] uppercase text-vds-primary">
                      {item.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-vds-muted">
                    {item.summary}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[.15em] text-vds-subtle">
                    Recommendation only
                  </p>
                </article>
              ))}
            </div>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-vds-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
              href="/vayon/ai/workforce/executive-ai"
            >
              Open governed Executive AI{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section>
          <SectionHeading
            icon={ShieldCheck}
            title="Security"
            detail="Identity and platform risk"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {data.security.map((item, index) => (
              <KpiCard item={item} index={index} key={item.id} />
            ))}
          </div>
        </section>
      </div>
      <section>
        <SectionHeading
          icon={Building2}
          title="System health"
          detail="Production infrastructure signals"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {data.health.map((item) => (
            <article className={`${card} p-4`} key={item.name}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">{item.name}</h3>
                <span
                  className={`size-2 rounded-full ${item.state === "healthy" ? "bg-vds-success" : item.state === "degraded" ? "bg-vds-warning" : "bg-vds-subtle"}`}
                  aria-label={item.state}
                />
              </div>
              <p className="mt-3 text-xs text-vds-muted">{item.value}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <SectionHeading
          icon={Sparkles}
          title="Quick actions"
          detail="Governed navigation shortcuts"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {actions.map(([label, href]) => (
            <Link
              className={`${card} group flex items-center justify-between p-4 text-sm font-medium transition hover:-translate-y-0.5 hover:border-vds-accent-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus`}
              href={href}
              key={label}
            >
              {label}
              <ArrowUpRight
                className="size-4 text-vds-subtle transition group-hover:text-vds-primary"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function KpiCard({ item, index }: { item: FounderKpi; index: number }) {
  return (
    <article
      className={`${card} min-h-32 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-vds-accent-border motion-safe:animate-[fade-in_.45s_ease-out_both]`}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
    >
      <p className="text-[10px] font-medium uppercase tracking-[.13em] text-vds-subtle">
        {item.label}
      </p>
      <p className="mt-4 text-2xl font-semibold tracking-tight">
        {formatMetric(item)}
      </p>
      <p
        className={`mt-2 text-[10px] uppercase tracking-[.12em] ${item.status === "measured" ? "text-vds-success" : "text-vds-subtle"}`}
      >
        {item.status}
      </p>
    </article>
  );
}
function formatMetric(item: FounderKpi) {
  if (item.value === null) return "—";
  if (item.unit === "percent")
    return `${item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  if (item.unit === "currency")
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(item.value);
  return item.value.toLocaleString(undefined, {
    notation: item.value > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  });
}
function SectionHeading({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Activity;
  title: string;
  detail: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-vds-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="mt-1 text-xs text-vds-muted">{detail}</p>
      </div>
    </div>
  );
}
