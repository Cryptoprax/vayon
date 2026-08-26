import { ArrowRight, CalendarClock, CheckCircle2, CircleDashed, Lightbulb, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";

const surfaces: readonly { title: string; recommendation: string; action: string; href: string; icon: LucideIcon }[] = [
  { title: "Content Queue", recommendation: "Prepare one audience-specific post for review.", action: "Prepare content", href: "/vayon/growth/content-calendar", icon: CalendarClock },
  { title: "Campaign Pipeline", recommendation: "Define the objective and audience for your first campaign.", action: "Plan campaign", href: "/vayon/growth/campaigns", icon: CircleDashed },
  { title: "Publishing Status", recommendation: "No publisher is connected. Keep content in approval-ready drafts.", action: "Review social workspace", href: "/vayon/growth/social-media", icon: CheckCircle2 },
  { title: "Brand Health", recommendation: "Add approved messaging and brand voice before drafting at scale.", action: "Review brand assets", href: "/vayon/growth/brand-assets", icon: Lightbulb },
  { title: "Community Growth", recommendation: "Choose one community and define a useful weekly initiative.", action: "Plan community", href: "/vayon/growth/community", icon: ArrowRight },
  { title: "Traffic Snapshot", recommendation: "Traffic evidence is unavailable until a governed source is connected.", action: "Review evidence", href: "/vayon/growth/analytics", icon: ArrowRight },
  { title: "Lead Generation", recommendation: "Prepare a campaign brief with one clear conversion objective.", action: "Define campaign", href: "/vayon/growth/campaigns", icon: ArrowRight },
  { title: "Upcoming Launches", recommendation: "Create a launch plan with owner, audience, and review date.", action: "Plan launch", href: "/vayon/growth/campaigns", icon: CalendarClock },
  { title: "Recent Wins", recommendation: "Wins appear only when supported by connected campaign evidence.", action: "Review analytics readiness", href: "/vayon/growth/analytics", icon: CheckCircle2 },
];

export function GrowthOverview() {
  return <div className="space-y-5"><section className="rounded-3xl border border-vds-primary bg-vds-primary-soft p-6" aria-labelledby="today-recommendation"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Today&apos;s Recommendation</p><h2 id="today-recommendation" className="mt-2 text-2xl font-semibold">Build one campaign brief around your highest-priority business outcome.</h2><p className="mt-2 text-sm text-vds-muted">Choose an audience, outcome, core message, and approval owner. VAYON will keep publishing disabled.</p><ButtonLink href="/vayon/growth/campaigns" className="mt-5">Plan first campaign<ArrowRight className="size-4" /></ButtonLink></section>
    <section aria-labelledby="growth-overview-title"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Executive overview</p><h2 id="growth-overview-title" className="mt-1 text-xl font-semibold">What needs attention next</h2></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{surfaces.map(({ icon: Icon, ...item }) => <article key={item.title} className="rounded-2xl border border-vds-border bg-vds-surface p-5"><Icon className="size-5 text-vds-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-vds-muted">{item.recommendation}</p><ButtonLink href={item.href} variant="secondary" size="sm" className="mt-4">{item.action}</ButtonLink></article>)}</div></section>
  </div>;
}
