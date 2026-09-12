import Link from "next/link";
import { ButtonLink } from "@/features/platform/design-system";
import { automationRules, autonomousWork, aiGoals, employeeActivity } from "./model";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

export function AIWorkQueue({ compact = false }: { compact?: boolean }) {
  const items = compact ? autonomousWork.slice(0, 4) : autonomousWork;
  return <section aria-labelledby="ai-work-title" className={card}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Human-controlled autonomy</p><h2 id="ai-work-title" className="mt-1 text-xl font-semibold">Today&apos;s AI Work</h2></div>
      <div className="flex gap-2"><Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href="/vayon/approvals">Review approvals</Link><ButtonLink size="sm" href="/vayon/ai/work-queue">View queue</ButtonLink></div>
    </div>
    <p className="mt-2 text-sm text-vds-muted">Prepared work remains reviewable. External actions never run without approval.</p>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {items.map((item) => <article key={item.id} className="rounded-xl border border-vds-border p-4">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm text-vds-muted">{item.employee} · {item.category} · {item.relatedEntity}</p></div><span className="rounded-full bg-vds-primary-soft px-2.5 py-1 text-xs font-medium text-vds-primary">{item.status}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-vds-muted">Priority</dt><dd>{item.priority}</dd></div><div><dt className="text-vds-muted">Current stage</dt><dd>{item.stage}</dd></div>{item.estimatedCompletion && <div><dt className="text-vds-muted">Estimated completion</dt><dd>{item.estimatedCompletion}</dd></div>}</dl>
        {typeof item.progress === "number" ? <progress className="mt-3 w-full" value={item.progress} max={100} aria-label={`${item.name} progress`} /> : <p className="mt-3 text-xs text-vds-muted">Progress is reported only when the workflow runtime provides it.</p>}
        {!compact && <div className="mt-4 flex flex-wrap gap-2"><Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={item.approvalId ? `/vayon/approvals/${item.approvalId}` : "/vayon/ai/history"}>View details</Link>{item.status === "Failed" && <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/ai/history?retry=${item.id}`}>Retry</Link>}{!["Completed","Cancelled"].includes(item.status) && <Link className="vds-focus rounded-lg border border-vds-border px-3 py-2 text-sm" href={`/vayon/ai/history?cancel=${item.id}`}>Cancel</Link>}</div>}
      </article>)}
    </div>
  </section>;
}

export function EmployeeActivity() { return <section className={card} aria-labelledby="employee-activity"><h2 id="employee-activity" className="text-xl font-semibold">AI employee activity</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="text-vds-muted"><tr><th className="pb-3">Employee</th><th>Working on</th><th>Upcoming work</th><th>Blocked</th><th>Last activity</th></tr></thead><tbody>{employeeActivity.map(([name, working, upcoming, blocked]) => <tr className="border-t border-vds-border" key={name}><th className="py-3 font-semibold">{name}</th><td>{working}</td><td>{upcoming}</td><td>{blocked}</td><td>From current workflow snapshot</td></tr>)}</tbody></table></div></section> }

export function GoalsAndStrategy() { return <div className="space-y-5">{aiGoals.map(goal => <article className={card} key={goal.id}><p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Executive strategy</p><h2 className="mt-1 text-xl font-semibold">{goal.name}</h2><p className="mt-2 text-sm text-vds-muted">{goal.strategy}</p><div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><List title="Required actions" items={goal.actions}/><List title="AI employees assigned" items={goal.employees}/><List title="Dependencies" items={goal.dependencies}/><List title="Approval gates" items={goal.approvalGates}/></div><p className="mt-5 text-sm"><span className="font-semibold">Timeline:</span> {goal.timeline} · <span className="font-semibold">Estimated outcome:</span> {goal.expectedOutcome}</p></article>)}<ButtonLink href="/vayon/ai/playground?intent=create-goal">Define a business goal</ButtonLink></div> }

export function AutomationRules() { return <section className={card}><h2 className="text-xl font-semibold">Smart automations</h2><p className="mt-2 text-sm text-vds-muted">Enabled rules prepare work only. Publishing, outreach and budget changes always require Approval Center review.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{automationRules.map(([trigger, action, source]) => <article className="rounded-xl border border-vds-border p-4" key={trigger}><h3 className="font-semibold">{trigger}</h3><p className="mt-1 text-sm">Prepare: {action}</p><p className="mt-2 text-xs text-vds-muted">Reuses {source} · Approval required</p><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" aria-label={`Enable ${trigger} automation`} /> Enabled</label></article>)}</div></section> }

function List({ title, items }: { title: string; items: readonly string[] }) { return <div><h3 className="text-sm font-semibold">{title}</h3><ul className="mt-2 space-y-1 text-sm text-vds-muted">{items.map(item => <li key={item}>• {item}</li>)}</ul></div> }
