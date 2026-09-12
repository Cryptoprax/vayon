"use client";
import { WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { Button } from "@/features/platform/design-system";

import { useMemo, useState } from "react";
import { Activity, Beaker, Boxes, GitBranch, Layers3, Network } from "lucide-react";
import type { CanonicalBusinessEvent } from "../../domain/contracts";
import type { LiveTimelineFilters, ObjectTimelineKind, ProjectionHealth } from "../../projections/live-contracts";
import { LiveTimelineProjectionService } from "../../projections/live-projection.service";
import { TimelineCorrelationService } from "../../services/correlation.service";
import { TimelineJourneyService } from "../../services/journey.service";
import { createLocalTimelinePreview } from "../../ingestion/preview-ingestion";
import { CorrelationExplorer } from "./CorrelationExplorer";
import { EventInspector } from "./EventInspector";
import { JourneyView } from "./JourneyView";
import { ProjectionDashboard } from "./ProjectionDashboard";
import { TimelineFeed } from "./TimelineFeed";
import { TimelineFilters } from "./TimelineFilters";

type View = "workspace" | "objects" | "correlation" | "journey" | "projections";
const views: readonly { id: View; label: string; icon: typeof Activity }[] = [
  { id: "workspace", label: "Workspace", icon: Activity },
  { id: "objects", label: "Objects", icon: Boxes },
  { id: "correlation", label: "Correlation", icon: Network },
  { id: "journey", label: "Journey", icon: GitBranch },
  { id: "projections", label: "Projections", icon: Layers3 },
];
const objectKinds: readonly ObjectTimelineKind[] = ["contact", "company", "property", "lead", "deal", "document", "task", "campaign"];
const projectionHealth: readonly ProjectionHealth[] = ["Workspace", "Department", "User", "Category", "Object", "Correlation"].map(projectionType => ({ projectionType, status: "empty", replayReady: true, sequenceStatus: "not-started", validationStatus: "not-evaluated" }));

export function TimelineExperience({ events = [] }: { readonly events?: readonly CanonicalBusinessEvent[] }) {
  const [view, setView] = useState<View>("workspace");
  const [filters, setFilters] = useState<LiveTimelineFilters>({});
  const [search, setSearch] = useState("");
  const [objectKind, setObjectKind] = useState<ObjectTimelineKind>("contact");
  const [selected, setSelected] = useState<CanonicalBusinessEvent>();
  const [preview, setPreview] = useState<readonly CanonicalBusinessEvent[]>([]);
  const activeEvents = preview.length ? preview : events;
  const projector = useMemo(() => new LiveTimelineProjectionService(), []);
  const correlation = useMemo(() => new TimelineCorrelationService(), []);
  const journey = useMemo(() => new TimelineJourneyService(), []);
  const visibleEvents = useMemo(() => {
    const object = view === "objects" && filters.object ? { ...filters.object, objectType: objectKind } : filters.object;
    const rendered = projector.render(activeEvents, { ...filters, object });
    const term = search.trim().toLocaleLowerCase();
    return term ? rendered.events.filter(event => [event.eventName, event.summary, event.actor.displayHint, event.actor.id, event.correlationId, event.subject.displayHint, event.subject.objectId].some(value => value?.toLocaleLowerCase().includes(term))) : rendered.events;
  }, [activeEvents, filters, objectKind, projector, search, view]);
  const correlationId = filters.correlationId ?? selected?.correlationId;
  const exploration = useMemo(() => correlationId ? correlation.explore(activeEvents, correlationId) : undefined, [activeEvents, correlation, correlationId]);
  const journeySteps = useMemo(() => journey.build(exploration?.nodes.map(node => node.event) ?? []), [exploration, journey]);

  return <div className="space-y-6">
    <WorkspaceHeader title="Business Timeline" description="Follow workspace activity, object history, correlated chains, and business journeys through one immutable chronological record." actions={<Button type="button" onClick={() => { setPreview(current => current.length ? [] : createLocalTimelinePreview()); setSelected(undefined); setFilters({}); setSearch("") }}><Beaker className="size-4" aria-hidden="true"/>{preview.length ? "Exit architecture preview" : "Load architecture preview"}</Button>} /><p className="text-xs text-vds-muted">Local preview boundary: Factory-generated samples ? No production ingestion</p>
    <nav aria-label="Timeline views" className="flex flex-wrap gap-3 rounded-2xl border border-vds-border/[.08] bg-vds-surface/[.02] p-2">{views.map(item => { const Icon = item.icon; return <Button variant="control" key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-vds-focus ${view === item.id ? "bg-vds-primary-soft text-vds-primary" : "text-vds-muted hover:bg-vds-surface/[.04] hover:text-vds-foreground"}`}><Icon className="size-4" aria-hidden="true"/>{item.label}</Button> })}</nav>
    {view !== "projections" && <TimelineFilters value={filters} onChange={setFilters} search={search} onSearch={setSearch}/>} 
    {view === "objects" && <section aria-label="Object timeline types" className="flex flex-wrap gap-2">{objectKinds.map(kind => <Button variant="control" key={kind} type="button" aria-pressed={objectKind === kind} onClick={() => setObjectKind(kind)} className={`rounded-full border px-3 py-1.5 text-xs capitalize transition focus-visible:outline-2 focus-visible:outline-vds-focus ${objectKind === kind ? "border-vds-accent-border bg-vds-primary-soft text-vds-primary" : "border-vds-border/[.08] text-vds-muted hover:text-vds-foreground"}`}>{kind}</Button>)}</section>}
    {(view === "workspace" || view === "objects") && <div className="grid gap-6 xl:grid-cols-[1fr_22rem]"><TimelineFeed events={visibleEvents} selectedId={selected?.eventId} onSelect={setSelected}/><EventInspector event={selected} onClose={() => setSelected(undefined)}/></div>}
    {view === "correlation" && <CorrelationExplorer exploration={exploration}/>} 
    {view === "journey" && <JourneyView steps={journeySteps}/>} 
    {view === "projections" && <ProjectionDashboard health={projectionHealth}/>} 
  </div>;
}
