"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { Button } from "@/features/platform/design-system";
import type { WorkforceEmployee } from "../domain/models";

const departments = ["All", "Sales", "Marketing", "Support", "Operations", "CRM", "Finance", "Executive"] as const;
const card = "rounded-3xl border border-vds-border bg-vds-surface p-5";

export const WorkforceDirectory = memo(function WorkforceDirectory({ items }: { items: readonly WorkforceEmployee[] }) {
  const [department, setDepartment] = useState<(typeof departments)[number]>("All");
  const visible = useMemo(() => department === "All" ? items : items.filter((item) => item.department === department), [department, items]);
  return <section aria-labelledby="directory-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Your AI Real Estate Company</p><h2 id="directory-title" className="mt-2 text-2xl font-semibold">Meet Your AI Team</h2></div><div className="flex gap-2 overflow-x-auto" aria-label="Filter AI employees by department">{departments.map((value) => <Button variant="control" type="button" aria-pressed={department === value} onClick={() => setDepartment(value)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${department === value ? "border-vds-accent-border bg-vds-primary-soft text-vds-primary" : "border-vds-border text-vds-muted"}`} key={value}>{value}</Button>)}</div></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visible.map((item) => <Link href={`/vayon/ai/workforce/${item.code}`} className={`${card} group transition hover:-translate-y-0.5 hover:border-vds-accent-border`} key={item.code}><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-vds-primary-soft font-semibold text-vds-primary">{item.avatar}</span><div className="min-w-0"><h3 className="font-semibold">{item.name}</h3><p className="truncate text-xs text-vds-muted">{item.role} · {item.department}</p></div><span className="ml-auto flex items-center gap-1 text-[10px] uppercase"><i className={`size-2 rounded-full ${item.status === "error" || item.status === "offline" ? "bg-vds-danger" : item.status === "processing" ? "animate-pulse bg-vds-warning" : "bg-vds-success"}`}/>{item.status}</span></div><p className="mt-4 line-clamp-2 text-sm text-vds-muted">{item.description}</p><dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-vds-muted">Availability</dt><dd className="mt-1 capitalize">{item.availability}</dd></div><div><dt className="text-vds-muted">Workload</dt><dd className="mt-1">{item.currentQueue} queued</dd></div></dl><div className="mt-4 flex flex-wrap gap-1.5">{item.capabilities.slice(0, 3).map((capability) => <span className="rounded-full bg-vds-elevated px-2 py-1 text-[10px]" key={capability}>{capability}</span>)}</div><p className="mt-4 text-xs text-vds-muted">{item.permissions.join(" · ")}</p></Link>)}</div>
    {!visible.length && <div className="mt-5 rounded-3xl border border-dashed border-vds-border p-12 text-center text-sm text-vds-muted">Your specialist is ready for a first assignment.</div>}
  </section>;
});

export function WorkforceMemory({ item }: { item: WorkforceEmployee }) {
  const metrics = [["Conversations", item.memory.conversationCount], ["Assigned customers", item.memory.assignedCustomers], ["Pending tasks", item.memory.pendingTasks], ["Completed actions", item.memory.completedActions], ["Knowledge references", item.memory.knowledgeReferences]] as const;
  return <section className={card}><div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[.18em] text-vds-primary">Agent memory</p><h2 className="mt-2 font-semibold">Workspace-scoped context</h2></div><span className="text-xs text-vds-muted">{item.memory.contextUtilization}% context window</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-vds-elevated"><span className="block h-full rounded-full bg-vds-primary" style={{ width: `${Math.min(100, item.memory.contextUtilization)}%` }}/></div><dl className="mt-5 grid gap-3 sm:grid-cols-5">{metrics.map(([label, value]) => <div key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl><p className="mt-4 text-xs text-vds-muted">Memory is isolated to this workspace. Empty values remain explicit and are never inferred from another tenant.</p></section>;
}
