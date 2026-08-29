import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";
import { executiveKpis, leadProfileFields, propertyAnalyticsWidgets, propertySignals, recommendations } from "./catalog";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

export function RealEstateSignalGrid({ kind, values = {} }: { readonly kind: "property" | "lead"; readonly values?: Readonly<Record<string, string | number | undefined>> }) {
  const signals = kind === "property" ? propertySignals : leadProfileFields;
  return <section className="mx-auto mt-6 max-w-[96rem] px-4 sm:px-6" aria-labelledby={`${kind}-intelligence-title`}>
    <h2 id={`${kind}-intelligence-title`} className="text-xl font-semibold">{kind === "property" ? "Property intelligence" : "Buyer and seller intelligence"}</h2>
    <p className="mt-1 text-sm text-vds-muted">Values appear only when supported by workspace-scoped records.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{signals.map((label) => <article className={card} key={label}><p className="text-xs font-medium text-vds-muted">{label}</p><p className={`mt-3 font-semibold ${values[label] == null ? "text-vds-subtle" : "text-vds-foreground"}`}>{values[label] ?? "Unavailable"}</p></article>)}</div>
  </section>;
}

export function ContextualRealEstateRecommendations({ kind }: { readonly kind: keyof typeof recommendations }) {
  return <section className="mx-auto mt-6 max-w-[96rem] px-4 sm:px-6" aria-labelledby={`${kind}-recommendations-title`}>
    <div className={`${card} bg-gradient-to-br from-vds-primary-soft to-vds-surface`}><div className="flex items-center gap-2"><Sparkles className="size-5 text-vds-primary" aria-hidden="true"/><h2 id={`${kind}-recommendations-title`} className="font-semibold">Recommended next actions</h2></div><p className="mt-2 text-sm text-vds-muted">Suggestions are preparation shortcuts. Nothing is executed without user approval.</p><div className="mt-4 flex flex-wrap gap-2">{recommendations[kind].map((label) => <ButtonLink key={label} href="/vayon/intelligence" variant="secondary" size="sm">{label}</ButtonLink>)}</div></div>
  </section>;
}

export function PropertyAnalyticsWidgets() {
  return <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Property analytics widgets">{propertyAnalyticsWidgets.map((label) => <article className={card} key={label}><p className="text-xs font-medium text-vds-muted">{label}</p><p className="mt-3 font-semibold text-vds-subtle">Unavailable</p><p className="mt-1 text-xs text-vds-subtle">Awaiting verified property activity</p></article>)}</section>;
}

export type ExecutiveKpiLabel = (typeof executiveKpis)[number];
