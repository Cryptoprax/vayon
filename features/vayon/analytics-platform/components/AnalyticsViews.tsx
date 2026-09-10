import Link from "next/link";
import type { ReactNode } from "react";
import type {
  AnalyticsDataset,
  AnalyticsInsight,
  AnalyticsSnapshot,
} from "../domain/models";
const card =
  "rounded-2xl border border-vds-border bg-vds-surface p-5 shadow-vds-sm";
const nav = [
  ["Overview", "/vayon/analytics"],
  ["Conversion", "/vayon/analytics/conversion"],
  ["Executive", "/vayon/analytics/executive"],
  ["Sales", "/vayon/analytics/sales"],
  ["CRM", "/vayon/analytics/crm"],
  ["Properties", "/vayon/analytics/properties"],
  ["Deals", "/vayon/analytics/deals"],
  ["Communications", "/vayon/analytics/communications"],
  ["Workforce", "/vayon/analytics/workforce"],
];
export function AnalyticsShell({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav
        aria-label="Performance reports"
        className="mx-auto flex max-w-[110rem] flex-wrap gap-2 px-5 pt-6"
      >
        {nav.map(([l, h]) => (
          <Link
            className="shrink-0 rounded-full border border-vds-border bg-vds-surface px-4 py-2 text-sm text-vds-muted hover:text-vds-foreground"
            href={h}
            key={h}
          >
            {l}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
export function AnalyticsHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-xs uppercase tracking-[.2em] text-vds-primary">
        Business performance
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
    </header>
  );
}
export function MetricGrid({ data }: { data: AnalyticsDataset }) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.metrics.map((x) => (
        <article className={card} key={x.id}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-vds-muted">{x.label}</p>
            <span
              className={`size-2 rounded-full ${x.available ? "bg-vds-success" : "bg-vds-warning"}`}
              aria-label={x.available ? "Available" : "No figures yet"}
            />
          </div>
          <p className="mt-3 text-xl font-semibold">
            {x.available ? x.value : "No figures yet"}
          </p>
          <p className="mt-2 text-xs text-vds-muted">{x.available ? x.explanation : "Record your business activity, then return to review this measure."}</p><details className="mt-2"><summary className="focus-ring cursor-pointer py-2 text-xs text-vds-muted">How this is measured</summary><p className="text-xs text-vds-muted">{x.explanation}</p>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-vds-subtle">
            Source: {x.source}
          </p></details>
        </article>
      ))}
    </section>
  );
}
export function Insights({ items }: { items: readonly AnalyticsInsight[] }) {
  return (
    <section className={`${card} mt-6`}>
      <h2 className="font-semibold">What the figures show</h2>
      <p className="mt-1 text-sm text-vds-muted">
        These observations use the business records behind the figures.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((x) => (
          <article className="rounded-xl bg-vds-elevated p-4" key={x.kind}>
            <p className="text-xs uppercase tracking-wide text-vds-primary">
              {x.kind.replaceAll("-", " ")}
            </p>
            <p className="mt-2 font-medium">{x.statement}</p>
            <p className="mt-2 text-xs text-vds-muted">
              Based on: {x.evidenceIds.join(", ") || "No records yet"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function PlatformHealth({ s }: { s: AnalyticsSnapshot }) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      {s.datasets
        .filter((x) =>
          ["workflow", "integrations", "observability"].includes(x.domain),
        )
        .map((x) => (
          <article className={card} key={x.domain}>
            <h2 className="font-semibold capitalize">{x.domain} health</h2>
            <div className="mt-4 space-y-2">
              {x.metrics.map((m) => (
                <div className="flex justify-between gap-3 text-sm" key={m.id}>
                  <span className="text-vds-muted">{m.label}</span>
                  <span>{m.available ? m.value : "No figures yet"}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
    </section>
  );
}
