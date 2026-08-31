import Link from "next/link";
import type { ExecutiveDashboardData } from "@/features/vayon/dashboard/types";

const surface = "rounded-2xl border border-vds-border bg-vds-surface p-5";

export function DailyBriefing({ data, userName }: { data: ExecutiveDashboardData; userName: string }) {
  const leadMetric = data.kpis.find((item) => item.key.includes("lead"));
  const taskMetric = data.kpis.find((item) => item.key.includes("task"));
  return <section className={surface} aria-labelledby="daily-briefing-title">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Daily briefing</p>
    <h2 id="daily-briefing-title" className="mt-1 text-xl font-semibold">Good morning, {userName}</h2>
    <p className="mt-2 text-sm text-vds-muted">Priorities derived from the current workspace dashboard, calendar, activity and AI work projections.</p>
    <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Brief label="Meetings and viewings" value={data.calendar.length} href="/vayon/calendar" />
      <Brief label="Leads" value={leadMetric?.value} href="/vayon/leads" />
      <Brief label="Tasks" value={taskMetric?.value} href="/vayon/tasks" />
      <Brief label="Recent activity" value={data.activities.length} href="/vayon/timeline" />
    </dl>
  </section>;
}

export function EntityCollaboration({ entityType, entityId, entityLabel }: { entityType: string; entityId: string; entityLabel: string }) {
  const query = new URLSearchParams({ entityType, entityId, entityLabel }).toString();
  return <section className={surface} aria-labelledby={`collaboration-${entityId}`}>
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Human + AI collaboration</p>
    <h2 id={`collaboration-${entityId}`} className="mt-1 text-xl font-semibold">Collaboration</h2>
    <p className="mt-2 text-sm text-vds-muted">Comments, @mentions, internal notes, attachments, approval notes, AI summaries and threaded replies remain connected to {entityLabel}.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/notifications?view=mentioned&${query}`}>Mentions</Link>
      <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/timeline?${query}`}>History</Link>
      <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/tasks?assign=${encodeURIComponent(entityLabel)}`}>Assign work</Link>
      <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/approvals?${query}`}>Approval notes</Link>
      <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/intelligence?${query}`}>AI summary</Link>
    </div>
    <p className="mt-4 text-xs text-vds-muted">Assignments reuse Tasks, Timeline, Inbox and Notifications. Approval history remains immutable.</p>
  </section>;
}

export function MeetingIntelligence() {
  return <section className={surface} aria-labelledby="meeting-intelligence-title"><h2 id="meeting-intelligence-title" className="text-xl font-semibold">AI meeting notes</h2><p className="mt-2 text-sm text-vds-muted">Meeting, call, viewing, support and negotiation records can be summarized into action items, decisions, risks, follow-ups, assignments and approval suggestions.</p><div className="mt-4 flex flex-wrap gap-2">{["AI summary","Action items","Decisions","Risks","Follow-ups","Assignments","Approval suggestions"].map(item => <span className="rounded-full border border-vds-border px-3 py-1.5 text-xs" key={item}>{item}</span>)}</div><Link className="vds-focus mt-4 inline-flex rounded-lg border border-vds-border px-3 py-2 text-sm" href="/vayon/meetings">Open meetings</Link></section>;
}

function Brief({ label, value, href }: { label: string; value?: number; href: string }) { return <div className="rounded-xl border border-vds-border p-4"><dt className="text-sm text-vds-muted">{label}</dt><dd className="mt-1 text-2xl font-semibold">{value ?? "—"}</dd><Link className="mt-2 inline-block text-xs text-vds-primary" href={href}>Open</Link></div>; }
