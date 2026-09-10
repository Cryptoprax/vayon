import type { ReactNode } from "react";
export function WorkforceShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-[96rem] px-4 py-7 sm:px-6 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">
          AI Assistant
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-vds-muted">{description}</p>
      </header>
      <div className="py-6">{children}</div>
    </main>
  );
}
