import { ArrowRight, Building2, CalendarDays, CircleDollarSign, Handshake, Target, TrendingUp, Users } from "lucide-react";
import { ButtonLink } from "@/features/platform/design-system";

const overviewCards = [
  { title: "New Leads", href: "/vayon/leads", action: "Add or import leads", icon: Target },
  { title: "Active Buyers", href: "/vayon/growth/buyer-intelligence", action: "Review buyer demand", icon: Users },
  { title: "New Sellers", href: "/vayon/growth/seller-intelligence", action: "Review seller enquiries", icon: Users },
  { title: "Properties Listed", href: "/vayon/properties", action: "Review listings", icon: Building2 },
  { title: "Properties Sold", href: "/vayon/deals", action: "Review transactions", icon: Handshake },
  { title: "Properties Rented", href: "/vayon/deals", action: "Review transactions", icon: Handshake },
  { title: "Conversion Rate", href: "/vayon/analytics/conversion", action: "Connect conversion evidence", icon: TrendingUp },
  { title: "Revenue", href: "/vayon/analytics/sales", action: "Review sales evidence", icon: CircleDollarSign },
  { title: "Commission", href: "/vayon/deals", action: "Review transaction values", icon: CircleDollarSign },
  { title: "Today's Viewings", href: "/vayon/calendar/site-visits", action: "Schedule a viewing", icon: CalendarDays },
  { title: "Upcoming Appointments", href: "/vayon/calendar", action: "Open calendar", icon: CalendarDays },
  { title: "Pending Offers", href: "/vayon/deals/offers", action: "Review offers", icon: Handshake },
  { title: "Hot Leads", href: "/vayon/leads", action: "Qualify leads", icon: Target },
  { title: "Cold Leads", href: "/vayon/leads", action: "Plan follow-up", icon: Target },
  { title: "Agent Performance", href: "/vayon/analytics/sales", action: "Review agent activity", icon: TrendingUp },
] as const;

export function GrowthOverview({ userName }: { readonly userName: string }) {
  return <div className="space-y-6">
    <section className="rounded-3xl border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-6 sm:p-8" aria-labelledby="growth-overview-title">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Real Estate Growth Center</p>
      <h2 id="growth-overview-title" className="mt-3 text-2xl font-semibold sm:text-4xl">Good morning, {userName}. Turn property activity into your next transaction.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted">Prioritize listings, buyers, sellers, campaigns, viewings, and offers from one evidence-backed workspace.</p>
      <ButtonLink href="/vayon/growth/lead-generation" className="mt-5">Plan lead generation<ArrowRight className="size-4" aria-hidden="true" /></ButtonLink>
    </section>
    <section aria-labelledby="real-estate-growth-signals">
      <h2 id="real-estate-growth-signals" className="text-xl font-semibold">Real estate growth signals</h2>
      <p className="mt-1 text-sm text-vds-muted">Metrics appear only when workspace-scoped evidence is available.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {overviewCards.map(({ title, href, action, icon: Icon }) => <article key={title} className="rounded-2xl border border-vds-border bg-vds-surface p-5">
          <Icon className="size-5 text-vds-primary" aria-hidden="true" />
          <h3 className="mt-4 font-semibold">{title}</h3>
          <p className="mt-2 text-2xl font-semibold text-vds-muted">Unavailable</p>
          <p className="mt-1 text-xs leading-5 text-vds-subtle">No verified workspace data is available for this signal.</p>
          <ButtonLink href={href} variant="ghost" size="sm" className="mt-3 px-0">{action}<ArrowRight className="size-3" aria-hidden="true" /></ButtonLink>
        </article>)}
      </div>
    </section>
  </div>;
}
