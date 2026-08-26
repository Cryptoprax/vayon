import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Lightbulb, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";
import { marketingReadiness, unavailableMarketingEvidence } from "./strategy-engine";
import { StrategyWorkspace } from "./StrategyWorkspace";

const briefSections = [
  { title: "Today's Priorities", text: "Define one campaign goal, audience, message, and approval owner.", href: "#strategy-generator-title" },
  { title: "Campaign Pipeline", text: "No reviewed campaign plan is available yet.", href: "/vayon/growth/campaigns" },
  { title: "Publishing Status", text: "Publishing remains unavailable; prepare approval-ready drafts only.", href: "/vayon/growth/social-media" },
  { title: "Brand Health", text: "No approved brand consistency evidence is available yet.", href: "/vayon/growth/brand-assets" },
  { title: "Community Growth", text: "No verified community growth evidence is available yet.", href: "/vayon/growth/community" },
  { title: "Traffic Snapshot", text: "No governed traffic source is connected.", href: "/vayon/growth/analytics" },
  { title: "Lead Generation", text: "No campaign-attributed lead evidence is available yet.", href: "/vayon/growth/campaigns" },
  { title: "Upcoming Launches", text: "No verified launch information is available yet.", href: "/vayon/growth/campaigns" },
  { title: "Brand Opportunities", text: "Document an approved brand voice before preparing creative requests.", href: "/vayon/growth/brand-assets" },
  { title: "Content Queue", text: "No approved content briefs are available yet.", href: "/vayon/growth/content-calendar" },
  { title: "Investor Communication", text: "No verified investor milestones are available yet.", href: "/vayon/growth/investor-relations" },
  { title: "Community Activity", text: "No governed community activity is available yet.", href: "/vayon/growth/community" },
  { title: "Marketing Risks", text: "Performance evidence, approval ownership, and publishing connections are currently missing.", href: "/vayon/growth/analytics" },
  { title: "Recent Wins", text: "Wins will appear only when supported by verified campaign evidence.", href: "/vayon/growth/analytics" },
] as const;

export function GrowthOverview({ userName }: { userName: string }) {
  const readiness = marketingReadiness(unavailableMarketingEvidence);
  return <div className="space-y-6"><section className="rounded-3xl border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-6 sm:p-8" aria-labelledby="executive-marketing-brief-title"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Executive Marketing Brief</p><h2 id="executive-marketing-brief-title" className="mt-3 text-2xl font-semibold sm:text-4xl">Good morning, {userName}.</h2><div className="mt-5 rounded-2xl border border-vds-border bg-vds-surface/70 p-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-vds-primary">Today&apos;s recommendation</p><h3 className="mt-2 text-xl font-semibold">Prepare your first evidence-backed campaign brief.</h3><p className="mt-2 text-sm leading-6 text-vds-muted"><strong>Reason:</strong> No campaign performance data is available yet, so the CMO cannot responsibly rank campaign opportunities.</p><p className="mt-2 text-sm text-vds-muted"><strong>Requirements:</strong> Confirm the goal, audience, message, creative assets, and approval owner.</p><p className="mt-2 text-sm text-vds-muted"><strong>Estimated effort:</strong> 45 minutes.</p><p className="mt-3 flex items-center gap-2 text-xs text-vds-success"><ShieldCheck className="size-4" aria-hidden="true" />Nothing is executed automatically.</p></div></section>

    <section aria-labelledby="marketing-health-title"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Marketing Health</p><h2 id="marketing-health-title" className="mt-1 text-xl font-semibold">Readiness without invented scores</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{readiness.map((item) => <article key={item.area} className="rounded-2xl border border-vds-border bg-vds-surface p-5"><div className="flex items-start justify-between gap-3"><Lightbulb className="size-5 text-vds-primary" aria-hidden="true" /><span className="rounded-full bg-vds-warning-soft px-2.5 py-1 text-[10px] font-medium uppercase text-vds-warning">{item.status}</span></div><h3 className="mt-4 font-semibold">{item.area}</h3><p className="mt-2 text-sm leading-6 text-vds-muted">{item.recommendation}</p><p className="mt-3 text-xs font-medium">Missing requirements</p><p className="mt-1 text-xs leading-5 text-vds-subtle">{item.missingRequirements.length ? item.missingRequirements.join(" · ") : "None identified from available evidence."}</p><ButtonLink href="#strategy-generator-title" variant="secondary" size="sm" className="mt-4">{item.nextAction}<ArrowRight className="size-3" /></ButtonLink></article>)}</div></section>

    <section aria-labelledby="brief-sections-title"><h2 id="brief-sections-title" className="text-xl font-semibold">Executive attention</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{briefSections.map((item) => <article key={item.title} className="rounded-2xl border border-vds-border bg-vds-surface p-5">{item.title === "Marketing Risks" ? <AlertTriangle className="size-5 text-vds-warning" aria-hidden="true" /> : item.title === "Upcoming Launches" ? <CalendarClock className="size-5 text-vds-primary" aria-hidden="true" /> : <CheckCircle2 className="size-5 text-vds-primary" aria-hidden="true" />}<h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-vds-muted">{item.text}</p><ButtonLink href={item.href} variant="ghost" size="sm" className="mt-3">Review next action<ArrowRight className="size-3" /></ButtonLink></article>)}</div></section>
    <StrategyWorkspace />
  </div>;
}
