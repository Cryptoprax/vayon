import type { IntegrationPlatformDashboardModel } from "../view-models/status";
import { integrationPlatformSummary } from "../view-models/status";
const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
export function ProviderStatusDashboard({
  model,
}: {
  model: IntegrationPlatformDashboardModel;
}) {
  const summary = integrationPlatformSummary(model);
  return (
    <section className="pb-10">
      <header className="border-t border-vds-border pt-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
          Sprint 28 deterministic control plane
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Provider status and capability discovery
        </h2>
        <p className="mt-2 text-sm text-vds-muted">
          Uniform lifecycle contracts with no network requests or production
          credentials.
        </p>
      </header>
      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {Object.entries(summary).map(([label, value]) => (
          <article key={label} className={card}>
            <p className="text-xs capitalize text-vds-muted">
              {label.replaceAll(/([A-Z])/g, " $1")}
            </p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {model.providers.map((item) => (
          <article key={item.provider.id} className={card}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{item.provider.name}</h3>
                <p className="text-xs text-vds-muted">
                  {item.provider.id} · v{item.provider.version}
                </p>
              </div>
              <span className="rounded-full bg-vds-primary-soft px-2 py-1 text-xs capitalize text-vds-primary">
                {item.health.status}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-vds-muted">Connection</dt>
                <dd className="mt-1 capitalize">
                  {item.connection?.status ?? "disconnected"}
                </dd>
              </div>
              <div>
                <dt className="text-vds-muted">Validation</dt>
                <dd className="mt-1">
                  {item.validation.valid ? "Valid" : "Needs attention"}
                </dd>
              </div>
              <div>
                <dt className="text-vds-muted">Latency</dt>
                <dd className="mt-1">{item.health.latencyMs} ms</dd>
              </div>
              <div>
                <dt className="text-vds-muted">Capabilities</dt>
                <dd className="mt-1">{item.capabilities.length}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.capabilities.map((capability) => (
                <span
                  key={capability.id}
                  className="rounded-full border border-vds-border px-2 py-1 text-[10px]"
                >
                  {capability.name}
                  {capability.approvalRequired ? " · approval" : ""}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
