import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import {
  Catalog,
  EventHeader,
  EventHistory,
  EventNav,
} from "../components/EventViews";
import { EventRegistry } from "../registry/event.registry";
import { InMemoryEventBus } from "../services/in-memory-event-bus";
export async function EventRoute({
  view,
}: {
  view: "overview" | "catalog" | "history";
}) {
  const registry = new EventRegistry(),
    bus = new InMemoryEventBus(registry),
    history = bus.snapshot();
  return (
    <WorkspaceContent >
      <EventNav />
      <EventHeader
        title={
          view === "catalog"
            ? "Event catalog"
            : view === "history"
              ? "Event history"
              : "Event Bus & Notification Backbone"
        }
        description="Deterministic, in-memory, immutable domain event delivery. No broker, persistence, production hooks, or autonomous execution."
      />
      {view === "catalog" && <Catalog items={registry.list()} />}{" "}
      {view !== "catalog" && <EventHistory items={history} />}{" "}
      {view === "overview" && (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Event Throughput", history.length],
            ["Notification Volume", 0],
            ["Module Activity", 0],
            ["Catalog Types", registry.list().length],
          ].map(([l, v]) => (
            <article
              className="rounded-2xl border border-vds-border bg-vds-surface p-5"
              key={l}
            >
              <p className="text-xs text-vds-muted">{l}</p>
              <p className="mt-2 text-2xl font-semibold">{v}</p>
            </article>
          ))}
        </section>
      )}
    </WorkspaceContent>
  );
}
