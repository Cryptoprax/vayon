import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Cpu,
  FileText,
  GitBranch,
  History,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CreativeExecutionService } from "./service";
type Snapshot = Awaited<ReturnType<CreativeExecutionService["snapshot"]>>;
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function ExecutionDashboard({
  snapshot,
  provider,
}: {
  readonly snapshot: Snapshot;
  readonly provider?: {readonly name:string;readonly state:string;readonly reason:string};
}) {
  const metrics: readonly [string, string | number, LucideIcon][] = [
    ["Queued", snapshot.metrics.queued, Clock3],
    ["Completed", snapshot.metrics.completed, CheckCircle2],
    ["Retries", snapshot.metrics.retries, RefreshCcw],
    ["Failures", snapshot.metrics.failures, XCircle],
    ["Latency", snapshot.metrics.averageLatencyMs ?? "Unavailable", Activity],
    ["Adapters", snapshot.adapters, Cpu],
  ];
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} p-6 sm:p-8`}>
        <Link
          href="/vayon/creative/runtime"
          className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
        >
          Founder · Creative Runtime
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
          Creative Execution Engine
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-vds-muted">
          Provider-independent planning, queueing, execution, events, and
          approval handoff. Live adapters are composed outside the engine.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(([label, value, Icon]) => (
          <article className={`${card} p-4`} key={String(label)}>
            <Icon className="size-5 text-vds-primary" />
            <p className="mt-4 text-xs text-vds-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={`${card} p-5`}>
          <h2 className="font-semibold">Execution lifecycle</h2>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            {[
              "Queued",
              "Planning",
              "WaitingProvider",
              "Executing",
              "WaitingApproval",
              "Completed",
            ].map((item, index) => (
              <span className="contents" key={item}>
                <span className="rounded-xl bg-vds-elevated px-3 py-2">
                  {item}
                </span>
                {index < 5 && <span>→</span>}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-vds-muted">
            Failed and Cancelled are terminal. Retries respect configured
            limits, priority, timeout, cancellation, and correlation IDs.
          </p>
        </section>
        <section className={`${card} p-5`}>
          <h2 className="font-semibold">Capability & provider readiness</h2>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-vds-elevated p-3">
            <span className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-vds-primary" />
              Document capability
            </span>
            <strong>{snapshot.documentCapability}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-vds-elevated p-3">
            <span className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-vds-primary" />
              Provider readiness
            </span>
            <strong>{snapshot.providerReadiness}</strong>
          </div>
        </section>
      </div>
      {provider && <section className={`${card} p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-vds-muted">Live document provider</p><h2 className="mt-1 font-semibold">{provider.name}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${provider.state==="available"?"bg-vds-success-soft text-vds-success":"bg-vds-warning-soft text-vds-warning"}`}>{provider.state==="available"?"Connected · Healthy":provider.state}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-5"><div><dt className="text-vds-muted">Current requests</dt><dd className="mt-1 font-semibold">{snapshot.metrics.queued}</dd></div><div><dt className="text-vds-muted">Completed</dt><dd className="mt-1 font-semibold">{snapshot.metrics.completed}</dd></div><div><dt className="text-vds-muted">Average duration</dt><dd className="mt-1 font-semibold">{snapshot.metrics.averageLatencyMs===null?"Unavailable":`${snapshot.metrics.averageLatencyMs} ms`}</dd></div><div><dt className="text-vds-muted">Estimated cost</dt><dd className="mt-1 font-semibold">Unavailable</dd></div><div><dt className="text-vds-muted">Diagnostic</dt><dd className="mt-1 font-semibold">{provider.reason}</dd></div></dl></section>}
      <section className={`${card} p-5`}>
        <div className="flex items-center gap-2">
          <GitBranch className="size-5 text-vds-primary" />
          <h2 className="font-semibold">Execution history</h2>
        </div>
        {snapshot.events.length ? (
          <div className="mt-4 space-y-2">
            {snapshot.events.map((event) => (
              <div
                className="rounded-xl bg-vds-elevated p-3 text-xs"
                key={event.id}
              >
                {event.type} · {event.correlationId} ·{" "}
                {new Date(event.occurredAt).toLocaleString()}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-vds-border p-10 text-center text-sm text-vds-muted">
            <History className="mx-auto mb-2 size-6" />
            No execution events. Assets cannot be generated without an adapter.
          </div>
        )}
      </section>
      <section className={`${card} p-5`}>
        <h2 className="font-semibold">
          Tenant-safe document repository contract
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Draft",
            "Save",
            "Load",
            "Version",
            "Archive",
            "Restore",
            "Delete",
            "Search",
          ].map((item) => (
            <span
              className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-vds-muted">
          Interface only. No persistence implementation or database changes.
        </p>
      </section>
    </main>
  );
}
