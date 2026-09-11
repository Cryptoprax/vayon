import type { ReactNode } from "react";
export function CrmShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="w-full min-w-0 py-6">
      <header className="flex flex-col gap-5 border-b border-vds-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
            Vayon CRM
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
        </div>
        {actions}
      </header>
      <div className="py-6">{children}</div>
    </main>
  );
}
