import type { ReactNode } from "react";
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}) {
  return (
    <header
      className={`vds-page-header flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
export function Page({
  children,
  width = "wide",
  className = "",
}: {
  readonly children: ReactNode;
  readonly width?: "narrow" | "standard" | "wide";
  readonly className?: string;
}) {
  const widths = {
    narrow: "max-w-3xl",
    standard: "max-w-6xl",
    wide: "max-w-[100rem]",
  };
  return (
    <main
      className={`vds-page mx-auto w-full px-4 py-8 sm:px-6 ${widths[width]} ${className}`}
    >
      {children}
    </main>
  );
}
export function Dashboard({
  children,
  className = "",
  density = "comfortable",
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly density?: "compact" | "comfortable" | "executive";
}) {
  const variants = {
    compact: "gap-3 sm:grid-cols-2 xl:grid-cols-4",
    comfortable: "gap-5 sm:grid-cols-2 xl:grid-cols-4",
    executive: "gap-6 md:grid-cols-2 2xl:grid-cols-4 2xl:[&>*]:min-h-40",
  };
  return (
    <div
      data-dashboard-density={density}
      className={`grid ${variants[density]} ${className}`}
    >
      {children}
    </div>
  );
}
export function Workspace({
  main,
  sidebar,
  className = "",
}: {
  readonly main: ReactNode;
  readonly sidebar?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={`grid gap-6 ${sidebar ? "xl:grid-cols-[1fr_22rem]" : ""} ${className}`}
    >
      <div className="min-w-0">{main}</div>
      {sidebar && <aside>{sidebar}</aside>}
    </div>
  );
}
export function Sidebar({
  children,
  label = "Sidebar",
  className = "",
}: {
  readonly children: ReactNode;
  readonly label?: string;
  readonly className?: string;
}) {
  return (
    <aside
      aria-label={label}
      className={`vds-surface min-h-full w-full rounded-2xl p-4 lg:w-64 ${className}`}
    >
      {children}
    </aside>
  );
}
export function Topbar({
  leading,
  children,
  trailing,
  className = "",
}: {
  readonly leading?: ReactNode;
  readonly children?: ReactNode;
  readonly trailing?: ReactNode;
  readonly className?: string;
}) {
  return (
    <header
      className={`vds-surface flex min-h-16 items-center gap-4 border-x-0 px-4 sm:px-6 ${className}`}
    >
      {leading}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
    </header>
  );
}
export function SplitView({
  primary,
  secondary,
  ratio = "balanced",
  className = "",
}: {
  readonly primary: ReactNode;
  readonly secondary: ReactNode;
  readonly ratio?: "balanced" | "primary" | "secondary";
  readonly className?: string;
}) {
  const ratios = {
    balanced: "lg:grid-cols-2",
    primary: "lg:grid-cols-[1.4fr_.6fr]",
    secondary: "lg:grid-cols-[.6fr_1.4fr]",
  };
  return (
    <div className={`grid gap-6 ${ratios[ratio]} ${className}`}>
      <div className="min-w-0">{primary}</div>
      <div className="min-w-0">{secondary}</div>
    </div>
  );
}
export function InspectorPanel({
  title,
  children,
  className = "",
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <aside
      aria-label={title}
      className={`vds-surface vds-raised rounded-3xl p-5 lg:sticky lg:top-20 ${className}`}
    >
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </aside>
  );
}
