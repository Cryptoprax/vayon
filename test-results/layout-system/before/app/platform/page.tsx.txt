import { Breadcrumbs } from "@/features/dashboard/components/Breadcrumbs";

export default function PlatformPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[100rem] flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <div className="xl:hidden">
        <Breadcrumbs
          items={[
            { label: "Mission Control", href: "/platform" },
            { label: "Executive" },
          ]}
        />
      </div>

      <div className="mt-8 max-w-3xl xl:mt-2">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-vds-primary shadow-[0_0_10px_var(--vds-color-primary)]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-vds-primary">
            Mission Control
          </p>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-vds-foreground sm:text-4xl">
          Executive workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted sm:text-base sm:leading-7">
          Your AtlasOS operating shell is ready. Select a platform area from the
          navigation to begin.
        </p>
      </div>

      <div className="mt-10 h-px w-full bg-gradient-to-r from-vds-surface via-vds-surface to-transparent" />

      <div className="flex flex-1 items-center justify-center py-20">
        <div className="max-w-sm text-center">
          <p className="text-sm font-medium text-vds-muted">
            Dashboard canvas
          </p>
          <p className="mt-2 text-xs leading-5 text-vds-subtle">
            Widgets, cards, and operational statistics will be introduced in a
            future dashboard phase.
          </p>
        </div>
      </div>
    </div>
  );
}
