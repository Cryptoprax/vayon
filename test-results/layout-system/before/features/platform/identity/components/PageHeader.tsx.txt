import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-vds-border/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-vds-primary shadow-[0_0_9px_var(--vds-color-primary)]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vds-primary">
            {eyebrow}
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-vds-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-vds-muted">
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
