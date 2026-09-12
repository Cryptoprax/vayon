import { AppWindow, CheckCircle2, PackageOpen } from "lucide-react";

import type { PlatformApplication } from "../types/application";

export interface ApplicationHeaderProps {
  applications: PlatformApplication[];
}

export function ApplicationHeader({
  applications,
}: ApplicationHeaderProps) {
  const installedCount = applications.filter(
    (application) => application.installed,
  ).length;

  return (
    <header className="flex flex-col gap-6 border-b border-vds-border/[0.07] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <AppWindow className="size-3.5 text-vds-primary" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vds-primary">
            Application Platform
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-vds-foreground sm:text-4xl">
          Applications
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted">
          Launch and govern every product, studio, and platform capability from
          one application-centric operating layer.
        </p>
      </div>

      <div className="flex items-center gap-5 text-xs">
        <div>
          <p className="flex items-center gap-1.5 font-medium text-vds-secondary">
            <CheckCircle2
              className="size-3.5 text-vds-success"
              aria-hidden="true"
            />
            {installedCount} installed
          </p>
          <p className="mt-1 text-[10px] text-vds-subtle">Ready to launch</p>
        </div>
        <div className="h-8 w-px bg-vds-surface/[0.08]" />
        <div>
          <p className="flex items-center gap-1.5 font-medium text-vds-secondary">
            <PackageOpen className="size-3.5 text-vds-primary" aria-hidden="true" />
            {applications.length} available
          </p>
          <p className="mt-1 text-[10px] text-vds-subtle">Platform catalog</p>
        </div>
      </div>
    </header>
  );
}
