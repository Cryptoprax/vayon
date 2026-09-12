import Link from "next/link";
import type { DomainEvent } from "../domain/event";
import type { EventDefinition } from "../registry/event.registry";
const card =
  "rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-vds-sm";
export function EventHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs uppercase tracking-[.2em] text-vds-primary">
        Platform event bus
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}
export function EventNav() {
  return (
    <nav className="mb-6 flex gap-2" aria-label="Event bus">
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/events"
      >
        Overview
      </Link>
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/events/catalog"
      >
        Catalog
      </Link>
      <Link
        className="rounded-full border border-vds-border px-4 py-2 text-sm"
        href="/vayon/events/history"
      >
        History
      </Link>
    </nav>
  );
}
export function Catalog({ items }: { items: readonly EventDefinition[] }) {
  return (
    <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((x) => (
        <article className={card} key={x.type}>
          <p className="font-semibold">{x.type}</p>
          <p className="mt-2 text-sm text-vds-muted">{x.description}</p>
          <p className="mt-3 text-xs text-vds-muted">
            Version {x.version} · execution disabled
          </p>
        </article>
      ))}
    </section>
  );
}
export function EventHistory({ items }: { items: readonly DomainEvent[] }) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">Immutable local event history</h2>
      {items.map((x) => (
        <article
          className="grid gap-2 border-b border-vds-divider py-4 sm:grid-cols-[1fr_auto]"
          key={x.eventId}
        >
          <div>
            <p>{x.eventType}</p>
            <p className="text-xs text-vds-muted">
              {x.sourceModule} · {x.correlationId}
            </p>
          </div>
          <time className="text-xs text-vds-muted">{x.timestamp}</time>
        </article>
      ))}
      {!items.length && (
        <p className="py-12 text-center text-sm text-vds-muted">
          No domain events have been published in this local process.
        </p>
      )}
    </section>
  );
}
