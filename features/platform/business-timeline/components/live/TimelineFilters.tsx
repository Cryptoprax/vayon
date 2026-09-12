"use client";
import { WorkspaceFilters } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { Button } from "@/features/platform/design-system";

import { Filter, RotateCcw, Search } from "lucide-react";
import type { EventCategory, EventPriority, EventSeverity } from "../../domain/contracts";
import type { LiveTimelineFilters } from "../../projections/live-contracts";

interface Props { readonly value: LiveTimelineFilters; readonly onChange: (filters: LiveTimelineFilters) => void; readonly search: string; readonly onSearch: (value: string) => void }

export function TimelineFilters({ value, onChange, search, onSearch }: Props) {
  const update = <K extends keyof LiveTimelineFilters>(key: K, next: LiveTimelineFilters[K]) => onChange({ ...value, [key]: next || undefined });
  return <WorkspaceFilters aria-label="Timeline filters">
    <div className="flex flex-wrap items-center gap-2"><Filter className="size-4 text-vds-primary" aria-hidden="true"/><span className="mr-auto text-sm font-medium">Filters</span><Button variant="control" type="button" onClick={() => { onChange({}); onSearch("") }} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-vds-muted hover:bg-vds-surface/[.05] hover:text-vds-foreground focus-visible:outline-2 focus-visible:outline-vds-focus"><RotateCcw className="size-3.5" aria-hidden="true"/>Reset</Button></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="relative md:col-span-2"><span className="sr-only">Structured timeline search</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-vds-subtle" aria-hidden="true"/><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Search event, actor, object or correlation…" className="w-full rounded-xl border border-vds-border/[.08] bg-vds-input py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-vds-subtle focus:border-vds-accent-border focus:ring-2 focus:ring-vds-focus"/></label>
      <Select label="Category" value={value.categories?.[0] ?? ""} onChange={next => update("categories", next ? [next as EventCategory] : undefined)} options={["sales","growth","communication","operations","finance","documents","governance","customer","integration","workforce","intelligence","platform","audit"]}/>
      <Select label="Priority" value={value.priorities?.[0] ?? ""} onChange={next => update("priorities", next ? [next as EventPriority] : undefined)} options={["low","normal","high","urgent"]}/>
      <Select label="Severity" value={value.severities?.[0] ?? ""} onChange={next => update("severities", next ? [next as EventSeverity] : undefined)} options={["informational","success","warning","error","critical"]}/>
      <Field label="Actor" value={value.actorId ?? ""} onChange={next => update("actorId", next)}/>
      <Field label="Workspace" value={value.workspaceId ?? ""} onChange={next => update("workspaceId", next)}/>
      <Field label="Correlation" value={value.correlationId ?? ""} onChange={next => update("correlationId", next)}/>
      <Field label="From" type="date" value={value.from?.slice(0, 10) ?? ""} onChange={next => update("from", next ? `${next}T00:00:00.000Z` : undefined)}/>
      <Field label="To" type="date" value={value.to?.slice(0, 10) ?? ""} onChange={next => update("to", next ? `${next}T23:59:59.999Z` : undefined)}/>
      <Field label="Object ID" value={value.object?.objectId ?? ""} onChange={next => update("object", next ? { objectId: next, objectType: value.object?.objectType ?? "contact" } : undefined)}/>
    </div>
  </WorkspaceFilters>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="text-xs text-vds-muted"><span>{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-vds-border/[.08] bg-vds-input px-3 py-2.5 text-sm text-vds-secondary outline-none focus:border-vds-accent-border focus:ring-2 focus:ring-vds-focus"/></label> }
function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="text-xs text-vds-muted"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-vds-border/[.08] bg-vds-input px-3 py-2.5 text-sm capitalize text-vds-secondary outline-none focus:border-vds-accent-border focus:ring-2 focus:ring-vds-focus"><option value="">All</option>{options.map(option => <option key={option}>{option}</option>)}</select></label> }
