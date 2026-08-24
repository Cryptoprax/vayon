import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  Cpu,
  GitBranch,
  Layers3,
  RadioTower,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CreativeRuntimeSnapshot } from "./types";
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function CreativeRuntimeDashboard({
  snapshot,
}: {
  readonly snapshot: CreativeRuntimeSnapshot;
}) {
  const enabled = Object.values(snapshot.capabilities).filter(Boolean).length,
    metrics: readonly [string, string | number, LucideIcon][] = [
      ["Registered providers", snapshot.providers.length, Boxes],
      ["Live providers", snapshot.liveProviders, RadioTower],
      ["Registered adapters", snapshot.registeredAdapters, Cpu],
      ["Available capabilities", enabled, Layers3],
      ["Runtime health", snapshot.health, Activity],
    ],
    jobMetrics: readonly [string, number, LucideIcon][] = [
      [
        "Queued Jobs",
        snapshot.jobs.filter((item) => item.state === "Queued").length,
        Clock3,
      ],
      [
        "Completed Jobs",
        snapshot.jobs.filter((item) => item.state === "Completed").length,
        CheckCircle2,
      ],
      [
        "Failed Jobs",
        snapshot.jobs.filter((item) => item.state === "Failed").length,
        AlertTriangle,
      ],
    ];
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_38%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link
              href="/vayon/creative"
              className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary"
            >
              Founder · Creative Studio
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
              AI Creative Runtime
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">
              Provider-independent routing, capabilities, job health, and
              fail-closed generation infrastructure.
            </p>
          </div>
          <div className="rounded-2xl border border-vds-warning/30 bg-vds-warning-soft px-4 py-3">
            <p className="text-xs font-semibold uppercase text-vds-warning">
              Unavailable
            </p>
            <p className="mt-1 text-xs text-vds-muted">
              No live providers or adapters
            </p>
          </div>
        </div>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value, Icon]) => (
          <article className={`${card} p-5`} key={String(label)}>
            <Icon className="size-5 text-vds-primary" />
            <p className="mt-4 text-xs text-vds-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <section className={`${card} overflow-hidden`}>
        <div className="p-5">
          <h2 className="font-semibold">Provider registry</h2>
          <p className="mt-1 text-xs text-vds-muted">
            Descriptors only. Provider names are never exposed to customer
            generation flows.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[75rem] text-left text-sm">
            <thead className="border-y border-vds-border text-xs text-vds-muted">
              <tr>
                {[
                  "Provider",
                  "Types",
                  "Status",
                  "Capabilities",
                  "Quality",
                  "Speed",
                  "Cost",
                  "Resolution",
                  "Editing",
                  "Generation",
                  "Video",
                  "Vector",
                  "Transparency",
                ].map((item) => (
                  <th className="px-4 py-3" key={item}>
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snapshot.providers.map((provider) => (
                <tr className="border-b border-vds-border/60" key={provider.id}>
                  <th className="px-4 py-4 font-medium">
                    {provider.displayName}
                  </th>
                  <td>{provider.providerType.join(", ")}</td>
                  <td>
                    <span className="rounded-full bg-vds-elevated px-2 py-1 text-xs">
                      {provider.status}
                    </span>
                  </td>
                  <td>{provider.supportedCapabilities.length || "None"}</td>
                  <td>{provider.qualityTier}</td>
                  <td>{provider.speedTier}</td>
                  <td>{provider.costTier}</td>
                  <td>{provider.maxResolution ?? "Unknown"}</td>
                  {[
                    provider.supportsEditing,
                    provider.supportsGeneration,
                    provider.supportsVideo,
                    provider.supportsVector,
                    provider.supportsTransparency,
                  ].map((value, index) => (
                    <td key={index}>
                      {value ? (
                        <CheckCircle2 className="size-4 text-vds-success" />
                      ) : (
                        <XCircle className="size-4 text-vds-muted" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={`${card} p-5`}>
          <div className="flex items-center gap-2">
            <GitBranch className="size-5 text-vds-primary" />
            <h2 className="font-semibold">Capability matrix</h2>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {Object.entries(snapshot.capabilities).map(
              ([capability, available]) => (
                <div
                  className="flex items-center justify-between rounded-xl bg-vds-elevated px-3 py-2 text-xs"
                  key={capability}
                >
                  <span>{capability.replaceAll("_", " ")}</span>
                  <span
                    className={
                      available ? "text-vds-success" : "text-vds-muted"
                    }
                  >
                    {available ? "Available" : "Unavailable"}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
        <section className={`${card} p-5`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-vds-primary" />
            <h2 className="font-semibold">Routing & fallback</h2>
          </div>
          <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl bg-vds-elevated p-4 text-xs">
            <span>Primary Provider</span>
            <span>→</span>
            <span>Secondary</span>
            <span>→</span>
            <span>Tertiary</span>
            <span>→</span>
            <strong>Unavailable</strong>
          </div>
          <p className="mt-4 text-sm text-vds-muted">
            Routes by required capability, resolution, brand requirements,
            style, priority, and fallback availability. With no provider
            available, every request fails closed before job creation.
          </p>
        </section>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {jobMetrics.map(([label, value, Icon]) => (
          <article className={`${card} p-5`} key={String(label)}>
            <Icon className="size-5 text-vds-primary" />
            <p className="mt-4 text-xs text-vds-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
            <p className="mt-2 text-xs text-vds-muted">
              No persisted runtime jobs
            </p>
          </article>
        ))}
      </section>
      <section className={`${card} p-5`}>
        <h2 className="font-semibold">Job observability contract</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Provider",
            "Latency",
            "Retries",
            "Cost estimate",
            "Resolution",
            "Aspect ratio",
            "Failure reason",
            "Correlation ID",
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
          Generated outputs must link Workspace → Project → Campaign → Brand →
          Creative Director → Asset Library.
        </p>
      </section>
    </main>
  );
}
