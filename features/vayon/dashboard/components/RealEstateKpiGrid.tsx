import Link from "next/link";
import type { ExecutiveDashboardData } from "../types";
import { executiveKpis } from "../../real-estate-experience/catalog";

const existingKey: Partial<Record<(typeof executiveKpis)[number], string>> = {
  "New Leads": "leads",
  "Expected Revenue": "revenue",
};

export function RealEstateKpiGrid({ data }: { readonly data: ExecutiveDashboardData }) {
  return <section aria-label="Real estate executive key performance indicators" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
    {executiveKpis.map((label) => {
      const metric = data.kpis.find((item) => item.key === existingKey[label]);
      return <Link href={metric?.href ?? "/vayon/analytics"} key={label} className="focus-ring rounded-2xl border border-vds-border bg-vds-surface p-5 transition hover:-translate-y-0.5 hover:border-vds-accent-border motion-reduce:transform-none motion-reduce:transition-none">
        <p className="text-xs font-medium uppercase tracking-[.12em] text-vds-muted">{label}</p>
        <p className="mt-3 text-2xl font-semibold">{metric?.displayValue ?? "Unavailable"}</p>
        <p className="mt-1 text-xs text-vds-subtle">{metric?.detail ?? "Awaiting verified workspace data"}</p>
      </Link>;
    })}
  </section>;
}
