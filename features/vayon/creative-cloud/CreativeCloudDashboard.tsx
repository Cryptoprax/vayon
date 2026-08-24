import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Brain,
  Building2,
  Cloud,
  Database,
  GitBranch,
  LockKeyhole,
  Network,
  RadioTower,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { CreativeCloudSnapshot } from "./types";
const card =
  "rounded-3xl border border-vds-border bg-vds-surface/75 shadow-xl shadow-vds-shadow/10 backdrop-blur-xl";
export function CreativeCloudDashboard({
  snapshot,
}: {
  readonly snapshot: CreativeCloudSnapshot;
}) {
  return (
    <main className="mx-auto w-full max-w-[120rem] space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header className={`${card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,var(--vds-color-primary-soft),transparent_38%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-vds-primary">
            Independent Creative Operating System
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">
            VAYON Creative Cloud
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">
            One architecture for studios, AI departments, memory, assets,
            prompts, approvals, pipelines, runtime, providers, costs, and future
            execution.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ["Studios", snapshot.studios.length],
              ["AI departments", snapshot.departments.length],
              [
                "Specialists",
                snapshot.departments.reduce(
                  (sum, item) => sum + item.specialists.length,
                  0,
                ),
              ],
              ["Live providers", 0],
            ].map(([label, value]) => (
              <span
                className="rounded-full border border-vds-border bg-vds-elevated px-3 py-1.5 text-xs"
                key={label}
              >
                {label}: {value}
              </span>
            ))}
          </div>
        </div>
      </header>
      <section>
        <Heading
          icon={Cloud}
          title="Creative Cloud modules"
          detail="Every studio follows one permanent operating contract"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {snapshot.studios.map((studio) => (
            <article
              className={`${card} flex min-h-56 flex-col p-4`}
              key={studio.id}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl bg-vds-primary-soft text-vds-primary">
                  <Boxes className="size-4" />
                </span>
                <span className="text-[9px] uppercase tracking-wider text-vds-muted">
                  {studio.implementation}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{studio.name}</h3>
              <p className="mt-2 flex-1 text-xs leading-5 text-vds-muted">
                {studio.purpose}
              </p>
              <p className="mt-3 text-[10px] text-vds-muted">
                {studio.supportedAssets.join(" · ")}
              </p>
              {studio.route ? (
                <Link
                  href={studio.route}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-vds-primary"
                >
                  Open module <ArrowUpRight className="size-3" />
                </Link>
              ) : (
                <span className="mt-4 text-xs text-vds-muted">
                  Architecture ready
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
      <section>
        <Heading
          icon={Building2}
          title="AI department operating model"
          detail="Creative Director coordinates every director and specialist"
        />
        <div className={`${card} overflow-x-auto p-5`}>
          <div className="flex min-w-max items-start gap-3">
            <article className="w-48 rounded-2xl border border-vds-accent-border bg-vds-primary-soft p-4">
              <Sparkles className="size-5 text-vds-primary" />
              <h3 className="mt-3 font-semibold">Creative Director</h3>
              <p className="mt-2 text-xs text-vds-muted">
                Single orchestration authority
              </p>
            </article>
            <div className="mt-14 h-px w-8 bg-vds-border" />
            <div className="grid grid-cols-3 gap-3 xl:grid-cols-5">
              {snapshot.departments
                .filter((item) => item.parentId)
                .map((department) => (
                  <article
                    className="w-48 rounded-2xl border border-vds-border bg-vds-elevated p-4"
                    key={department.id}
                  >
                    <Users className="size-4 text-vds-primary" />
                    <h3 className="mt-3 text-sm font-semibold">
                      {department.name}
                    </h3>
                    <p className="mt-2 text-[10px] text-vds-muted">
                      {department.specialists.length} specialists · orchestrated
                      only
                    </p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className={`${card} p-5`}>
          <Heading
            icon={Database}
            title="Creative Cloud memory"
            detail="Architecture only · no persistence changes"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Shared Brand Memory",
              "Campaign Memory",
              "Creative Memory",
              "Prompt Memory",
              "Approval Memory",
              "Asset Relationships",
              "Version Relationships",
            ].map((item) => (
              <div
                className="flex items-center gap-2 rounded-xl bg-vds-elevated px-3 py-2 text-xs"
                key={item}
              >
                <LockKeyhole className="size-3 text-vds-primary" />
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className={`${card} p-5`}>
          <Heading
            icon={Network}
            title="Unified asset graph"
            detail="Every asset connected with tenant-scoped lineage"
          />
          <div className="flex flex-wrap gap-2">
            {[
              "Brand",
              "Campaign",
              "Project",
              "Document",
              "Image",
              "Video",
              "Website",
              "Presentation",
              "Email",
              "Advertisement",
              "Social Post",
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
            Relationships: belongs to · uses brand · generated for · version of
            · approved by · references
          </p>
        </section>
      </div>
      <section className={`${card} p-5`}>
        <Heading
          icon={Brain}
          title="Unified creative prompt"
          detail="One schema shared by every studio"
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Business Goal",
            "Audience",
            "Tone",
            "Brand",
            "Campaign",
            "Language",
            "Region",
            "Industry",
            "Style",
            "Outputs",
            "Constraints",
          ].map((item) => (
            <div className="rounded-xl bg-vds-elevated p-3 text-xs" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
        <section className={`${card} p-5`}>
          <Heading
            icon={ShieldCheck}
            title="Approval lifecycle"
            detail="Reusable governance across all studios"
          />
          <div className="flex min-w-max items-center gap-2 overflow-x-auto pb-2">
            {snapshot.approvalLifecycle.map((stage, index) => (
              <div className="flex items-center gap-2" key={stage}>
                <span className="rounded-xl border border-vds-border bg-vds-elevated px-3 py-2 text-xs">
                  {stage}
                </span>
                {index < snapshot.approvalLifecycle.length - 1 && (
                  <span className="text-vds-muted">→</span>
                )}
              </div>
            ))}
          </div>
          <Heading
            icon={GitBranch}
            title="Execution lifecycle"
            detail="Departments never communicate directly"
          />
          <div className="mt-3 flex min-w-max items-center gap-2 overflow-x-auto pb-2">
            {snapshot.executionPath.map((stage, index) => (
              <div className="flex items-center gap-2" key={stage}>
                <span className="rounded-xl bg-vds-primary-soft px-3 py-2 text-xs text-vds-primary">
                  {stage}
                </span>
                {index < snapshot.executionPath.length - 1 && <span>→</span>}
              </div>
            ))}
          </div>
        </section>
        <aside className={`${card} p-5`}>
          <Heading
            icon={Activity}
            title="Observability"
            detail="Evidence-safe readiness"
          />
          <div className="space-y-2">
            {Object.entries(snapshot.observability).map(([key, value]) => (
              <div
                className="flex justify-between rounded-xl bg-vds-elevated px-3 py-2 text-xs"
                key={key}
              >
                <span className="capitalize text-vds-muted">
                  {key.replaceAll(/([A-Z])/g, " $1")}
                </span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <section className={`${card} p-5`}>
        <Heading
          icon={RadioTower}
          title="Future provider strategy"
          detail="Capability requirements only · no implementation"
        />
        <div className="flex flex-wrap gap-2">
          {snapshot.providerStrategy.map((item) => (
            <span
              className="rounded-full border border-vds-border px-3 py-1.5 text-xs"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-vds-muted">
          Cost attribution prepares estimated cost, provider cost, token cost,
          generation cost, export cost, and budget allocation. Billing is not
          integrated.
        </p>
      </section>
      <section>
        <Heading
          icon={Rocket}
          title="Evolution roadmap"
          detail="Six deliberate implementation phases"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {snapshot.roadmap.map((item) => (
            <article className={`${card} p-4`} key={item.phase}>
              <span className="text-[10px] font-semibold uppercase text-vds-primary">
                Phase {item.phase}
              </span>
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-[10px] uppercase text-vds-muted">
                Future
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
function Heading({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Cloud;
  title: string;
  detail: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-vds-primary" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="mt-1 text-xs text-vds-muted">{detail}</p>
    </div>
  );
}
