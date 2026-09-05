"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/features/platform/design-system";
import type { ExecutiveDashboardData } from "../types";

interface Recommendation {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly href: string;
}

export function ExecutiveCommandCenter({
  data,
  userName,
}: {
  readonly data: ExecutiveDashboardData;
  readonly userName: string;
}) {
  const [dismissed, setDismissed] = useState<readonly string[]>([]);
  const metric = (key: string) => data.kpis.find((item) => item.key === key);
  const tasks = metric("tasks")?.value ?? 0;
  const leads = metric("leads")?.value ?? 0;
  const revenue = metric("revenue");
  const approvals = data.notifications.filter((item) =>
    item.category.toLowerCase().includes("approval"),
  );
  const customerActivity = data.activities.filter((item) =>
    /lead|contact|customer|deal/i.test(item.eventType),
  );
  const insights = useMemo(() => {
    const items: string[] = [];
    if (revenue && revenue.value > 0)
      items.push(
        revenue.trend === 0
          ? `${revenue.displayValue} in verified paid-invoice revenue is available.`
          : `Verified revenue is ${revenue.trend > 0 ? "up" : "down"} ${Math.abs(revenue.trend)}% against the previous period.`,
      );
    if (tasks > 0)
      items.push(`${tasks} ${tasks === 1 ? "task requires" : "tasks require"} attention.`);
    if (leads > 0)
      items.push(`${leads} active ${leads === 1 ? "lead is" : "leads are"} in the customer pipeline.`);
    if (data.ai.recommendations > 0)
      items.push(`${data.ai.recommendations} governed AI ${data.ai.recommendations === 1 ? "recommendation is" : "recommendations are"} ready for review.`);
    return items;
  }, [data.ai.recommendations, leads, revenue, tasks]);
  const recommendations = useMemo<readonly Recommendation[]>(() => {
    const items: Recommendation[] = [];
    if (!leads)
      items.push({ id: "crm", title: "Import CRM", detail: "Build your first customer pipeline.", href: "/vayon/settings/integrations/data-import" });
    if (!data.activities.some((item) => /campaign/i.test(item.eventType)))
      items.push({ id: "campaign", title: "Create your first campaign", detail: "Turn a business goal into a governed campaign.", href: "/vayon/creative/campaigns" });
    if (!data.aiWorkforce.length)
      items.push({ id: "workforce", title: "Create an AI employee", detail: "Start with a governed role for your team.", href: "/onboarding/ai-workforce" });
    if (!data.calendar.length)
      items.push({ id: "calendar", title: "Configure your calendar", detail: "Bring upcoming meetings into executive context.", href: "/vayon/settings/integrations/google" });
    items.push({ id: "proposal", title: "Generate a proposal", detail: "Open the AI document workspace.", href: "/vayon/creative/documents" });
    return items;
  }, [data.activities, data.aiWorkforce.length, data.calendar.length, leads]);
  const visibleRecommendations = recommendations.filter(
    (item) => !dismissed.includes(item.id),
  );
  const evidenceSignals = [revenue?.value, leads, data.activities.length, data.calendar.length].filter(
    (value) => Number(value) > 0,
  ).length;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-vds-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-5 shadow-xl shadow-vds-shadow/10 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-vds-primary/[.07] blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
              Executive Command Center · {data.workspaceName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              Good morning, {userName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted sm:text-base">
              Your AI Team is already working. Review its verified priorities, recommendations, and upcoming work for {data.organizationName}.
            </p>
          </div>
          <div className="rounded-2xl border border-vds-border bg-vds-input px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium"><HeartPulse className="size-4 text-vds-success" aria-hidden="true" />Business health</p>
            <p className="mt-1 text-xs text-vds-muted">{evidenceSignals}/4 operating signals connected</p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <article className="rounded-3xl border border-vds-border bg-vds-input p-5" aria-labelledby="ai-insights-heading">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-5" aria-hidden="true" /></span>
              <div><p className="text-xs uppercase tracking-[.16em] text-vds-primary">AI insights</p><h2 id="ai-insights-heading" className="mt-1 font-semibold">What deserves attention</h2></div>
            </div>
            {insights.length ? (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {insights.map((insight) => <li className="rounded-2xl bg-vds-elevated p-3 text-sm leading-6 text-vds-muted" key={insight}>{insight}</li>)}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-vds-border p-4 text-sm leading-6 text-vds-muted">AI insights will appear when governed revenue, CRM, task, or workforce evidence becomes available. No metrics have been inferred.</p>
            )}
          </article>
          <article className="rounded-3xl border border-vds-border bg-vds-input p-5" aria-labelledby="priorities-heading">
            <div className="flex items-center gap-2"><ClipboardCheck className="size-5 text-vds-accent" aria-hidden="true" /><h2 id="priorities-heading" className="font-semibold">Today’s priorities</h2></div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[["Tasks", tasks], ["Meetings", data.calendar.length], ["Approvals", approvals.length], ["Customer activity", customerActivity.length]].map(([label, value]) => (
                <div className="rounded-2xl bg-vds-elevated p-3" key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd></div>
              ))}
            </dl>
          </article>
        </div>

        {visibleRecommendations.length > 0 && (
          <div className="mt-4" aria-labelledby="recommendations-heading">
            <div className="flex items-center gap-2"><Lightbulb className="size-4 text-vds-warning" aria-hidden="true" /><h2 id="recommendations-heading" className="text-sm font-semibold">Smart recommendations</h2></div>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {visibleRecommendations.slice(0, 3).map((item) => (
                <div className="group flex items-start gap-3 rounded-2xl border border-vds-border bg-vds-surface p-4" key={item.id}>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-vds-primary" aria-hidden="true" />
                  <Link className="min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus" href={item.href}><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs leading-5 text-vds-muted">{item.detail}</span></Link>
                  <Button variant="ghost" size="sm" aria-label={`Dismiss ${item.title}`} onClick={() => setDismissed((items) => [...items, item.id])} className="size-8 p-0"><X className="size-4" aria-hidden="true" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SignalSummary icon={CalendarDays} label="Next meeting" value={data.calendar[0]?.title ?? "No meeting scheduled"} />
          <SignalSummary icon={BellRing} label="Pending approvals" value={approvals.length ? `${approvals.length} awaiting review` : "No pending approvals"} />
          <SignalSummary icon={CheckCircle2} label="Recent customer activity" value={customerActivity[0]?.title ?? "No customer activity yet"} />
        </div>
      </div>
    </section>
  );
}

function SignalSummary({ icon: Icon, label, value }: { readonly icon: typeof CalendarDays; readonly label: string; readonly value: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-vds-border bg-vds-input p-4"><Icon className="mt-0.5 size-4 shrink-0 text-vds-primary" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-vds-muted">{label}</p><p className="mt-1 truncate text-sm font-medium">{value}</p></div></div>;
}
