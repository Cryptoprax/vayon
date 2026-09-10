"use client";


import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";
import type { ExecutiveDashboardData } from "../types";

export function ExecutiveCommandCenter({
  data,
  userName,
}: {
  readonly data: ExecutiveDashboardData;
  readonly userName: string;
}) {
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
  const dueToday = data.calendar.filter((item) => item.kind === "task");
  const meetings = data.calendar.filter((item) => item.kind === "meeting");
  const visits = data.calendar.filter((item) => item.kind === "visit");
  const calls = data.calendar.filter((item) => item.kind === "call");
  const insights = [
    ...dueToday.slice(0, 2).map((item) => `Task due today: ${item.title}`),
    ...meetings.slice(0, 1).map((item) => `On today's calendar: ${item.title}`),
    ...visits.slice(0, 1).map((item) => `Viewing recorded today: ${item.title}`),
    ...(approvals.length ? [`${approvals.length} approval notification(s) to review.`] : []),
  ];
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
              Today&apos;s work - {data.workspaceName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              Good morning, {userName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted sm:text-base">
              Review follow-ups, property work, and meetings for {data.organizationName}. Start with the next action that needs your attention.
            </p>
          </div>
          <div className="flex flex-col gap-3"><ButtonLink href={data.isEmpty ? "#getting-started-title" : "#calendar-heading"}>Start today&apos;s work</ButtonLink><div className="rounded-2xl border border-vds-border bg-vds-input px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium"><HeartPulse className="size-4 text-vds-success" aria-hidden="true" />Business health</p>
            <p className="mt-1 text-xs text-vds-muted">{evidenceSignals}/4 areas with recorded activity</p>
          </div></div>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <article className="rounded-3xl border border-vds-border bg-vds-input p-5" aria-labelledby="ai-insights-heading">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-5" aria-hidden="true" /></span>
              <div><p className="text-xs uppercase tracking-[.16em] text-vds-primary">Morning Brief</p><h2 id="ai-insights-heading" className="mt-1 font-semibold">Your recorded work today</h2></div>
            </div>
            {insights.length ? (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {insights.map((insight) => <li className="rounded-2xl bg-vds-elevated p-3 text-sm leading-6 text-vds-muted" key={insight}>{insight}</li>)}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-vds-border p-4 text-sm leading-6 text-vds-muted">{data.isEmpty ? "Complete your setup to unlock more personalized recommendations." : "No due tasks or scheduled events appear in this snapshot. Review your calendar and tasks before planning more work."}</p>
            )}
          </article>
          <article className="rounded-3xl border border-vds-border bg-vds-input p-5" aria-labelledby="priorities-heading">
            <div className="flex items-center gap-2"><ClipboardCheck className="size-5 text-vds-accent" aria-hidden="true" /><h2 id="priorities-heading" className="font-semibold">Today’s priorities</h2></div>
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[["Open tasks", tasks], ["Meetings today", meetings.length], ["Approval notices", approvals.length], ["Recent customer activity", customerActivity.length]].map(([label, value]) => (
                <div className="rounded-2xl bg-vds-elevated p-3" key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd></div>
              ))}
            </dl>
          </article>
        </div>


        {calls.length > 0 && <p className="mt-4 text-sm text-vds-muted">Today&apos;s recorded work: {calls.length} call log(s). Review outcomes in Communications.</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SignalSummary icon={CalendarDays} label="Next meeting" value={meetings[0]?.title ?? "No meeting recorded today"} />
          <SignalSummary icon={BellRing} label="Approval notifications" value={approvals.length ? `${approvals.length} notices to review` : "No approval notices in this snapshot"} />
          <SignalSummary icon={CheckCircle2} label="Recent customer activity" value={customerActivity[0]?.title ?? "No customer activity yet"} />
        </div>
      </div>
    </section>
  );
}

function SignalSummary({ icon: Icon, label, value }: { readonly icon: typeof CalendarDays; readonly label: string; readonly value: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-vds-border bg-vds-input p-4"><Icon className="mt-0.5 size-4 shrink-0 text-vds-primary" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-vds-muted">{label}</p><p className="mt-1 truncate text-sm font-medium">{value}</p></div></div>;
}
