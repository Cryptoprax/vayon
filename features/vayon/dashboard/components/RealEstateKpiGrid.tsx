import Link from "next/link";
import { ArrowRight, CheckCircle2, BriefcaseBusiness, Building2, ClipboardCheck, Globe, Sparkles, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ExecutiveDashboardData } from "../types";

type DisplayMetric = {
  label: string; value: string; detail: string; href: string; action: string;
  group?: string; badge: string; success?: boolean; trend?: number; trendLabel?: string;
};

export function RealEstateKpiGrid({ data }: { readonly data: ExecutiveDashboardData }) {
  const metric = (key: string) => data.kpis.find((item) => item.key === key);
  const pipeline = metric("pipeline"), deals = metric("deals"), properties = metric("properties");
  const closed = data.pipeline.find((item) => item.id === "completed");
  // The existing calendar already contains only today's due tasks.
  const tasks = data.calendar.filter((item) => item.kind === "task").length;
  // Notifications are a capped preview, never an authoritative approval total.
  const approvals = data.notifications.filter((item) => /approval/i.test(item.category)).length;
  const items: DisplayMetric[] = [
    { label: "Revenue Pipeline", value: pipeline?.displayValue ?? "Build your pipeline", detail: pipeline?.value === 0 ? "No open deal value yet" : "Value of open deals", href: pipeline?.value === 0 ? "/vayon/deals/new" : "/vayon/deals", action: pipeline?.value === 0 ? "Create your first opportunity" : "Review pipeline", badge: pipeline ? "Open deals" : "Get started", trend: pipeline?.trend, trendLabel: "New deal value vs last week" },
    { label: "Pending Deals", group: "Sales", value: deals?.value === 0 ? "No deals yet" : deals?.displayValue ?? "Start a deal", detail: deals?.value === 0 ? "Convert a qualified lead into a deal" : "Open opportunities in your pipeline", href: deals?.value === 0 ? "/vayon/deals/new" : "/vayon/deals", action: deals?.value === 0 ? "Create your first opportunity" : "Review open deals", badge: deals ? "Open" : "Get started", trend: deals?.trend, trendLabel: "New deals vs last week" },
    { label: "Closed Deals", group: "Sales", value: closed ? String(closed.count) : "Track closings", detail: closed?.count === 0 ? "Your first closing starts with an opportunity" : "Deals in the completed stage", href: "/vayon/deals?stage=completed", action: "Review completed deals", badge: closed?.count ? "Completed" : "Getting started", success: Boolean(closed?.count), trend: closed?.trend, trendLabel: "Completed deal updates vs last week" },
    { label: "Active Listings", group: "Operations", value: properties?.value === 0 ? "No listings yet" : "Review listings", detail: properties && properties.value > 0 ? `${properties.displayValue} total properties · Check active status in Properties` : "Start by creating your first property", href: properties?.value === 0 ? "/vayon/properties/new" : "/vayon/properties", action: properties?.value === 0 ? "Add your first property" : "Manage properties", badge: properties?.value === 0 ? "Get started" : "Review status" },
    { label: "Tasks Due Today", group: "Operations", value: String(tasks), detail: tasks ? "Due before the end of today" : "No tasks due today", href: "/vayon/tasks", action: "Open tasks", badge: tasks ? "Due today" : "All clear", success: tasks === 0 },
    { label: "Hot Opportunities", group: "Business", value: "Find your next win", detail: "Review and prioritize opportunities in Deals", href: "/vayon/deals", action: "Review opportunities", badge: "Prioritize" },
    { label: "Pending Approvals", group: "Business", value: approvals ? `${approvals} to review` : "Inbox clear", detail: approvals ? "Approval alerts in your recent notifications" : "No approval alerts in recent notifications", href: "/vayon/approvals", action: "Check all approvals", badge: approvals ? "Needs review" : "No alerts", success: approvals === 0 },
    { label: "Website Visits Today", group: "Marketing", value: "Explore traffic", detail: "Explore visitor insights and website activity in Analytics", href: "/vayon/analytics", action: "Open traffic analytics", badge: "Set up insights" },
  ];

  // Use the same observed setup evidence as GettingStartedChecklist, without a second score.
  const setupEvidence = [
    data.organizationName !== "Organization" ? "Company profile ready" : null,
    properties && properties.value > 0 ? "First property added" : null,
    (metric("leads")?.value ?? 0) > 0 ? "First lead added" : null,
    data.whatsappConversations.length > 0 ? "WhatsApp activity recorded" : null,
    data.activities.some((item) => /import/i.test(`${item.eventType} ${item.title}`)) ? "Contacts imported" : null,
  ].filter((item): item is string => item !== null);
  // At most two short signals keep the summary below 72px, including on mobile.
  const summary = [
    data.ai.recommendations > 0 ? `${data.ai.recommendations} AI recommendations` : null,
    tasks > 0 ? `${tasks} tasks due today` : null,
    approvals > 0 ? `${approvals} recent approval alerts` : null,
  ].filter((item): item is string => item !== null).slice(0, 2);

  const linkedDestinations = new Set(["/vayon/analytics", "/vayon/deals", "/vayon/deals?stage=completed", "/vayon/properties/new", "/vayon/leads/new", "/vayon/tasks", "/vayon/properties"]);
  return (
    <section aria-labelledby="executive-kpi-heading" className="min-w-0 text-vds-foreground">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-vds-muted">Your business at a glance</p>
        <h2 id="executive-kpi-heading" className="mt-1 text-2xl font-semibold tracking-tight">Executive Overview</h2>
      </div>
      {summary.length > 0 && (
        <div aria-label="Today's AI Summary" className="mb-4 flex h-16 min-w-0 items-center gap-3 rounded-2xl border border-vds-border bg-vds-surface px-3 sm:px-5">
          <Sparkles aria-hidden="true" className="hidden size-5 shrink-0 text-vds-primary sm:block" />
          <p className="shrink-0 text-xs font-semibold">Today&apos;s<br className="sm:hidden" /> AI Summary</p>
          <ul className="min-w-0 text-xs leading-5 text-vds-muted sm:flex sm:flex-wrap sm:gap-x-5">
            {summary.map((signal) => <li key={signal}>{signal}</li>)}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const hero = index === 0;
          const showAction = !linkedDestinations.has(item.href);
          linkedDestinations.add(item.href);
          const GroupIcon = item.group === "Operations" ? Building2 : item.group === "Marketing" ? Globe : item.group === "Business" ? ClipboardCheck : BriefcaseBusiness;
          // Existing weekly series is the only evidence of activity for a comparison.
          const history = hero ? pipeline?.sparkline : item.label === "Pending Deals" ? deals?.sparkline : undefined;
          const hasHistory = history && history.length >= 7 && history.every(Number.isFinite) && history.some((value) => value > 0);
          const trend = hasHistory && item.trend !== undefined && Number.isFinite(item.trend) ? item.trend : undefined;
          const TrendIcon = trend === 0 ? Minus : trend !== undefined && trend > 0 ? TrendingUp : TrendingDown;
          const trendState = trend === 0 ? "Neutral" : trend !== undefined && trend > 0 ? "Positive" : "Needs Attention";
          return (
            <article key={item.label}
              className={`focus-ring group flex min-w-0 flex-col rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:border-vds-accent-border hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none ${hero ? "sm:col-span-2 border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft sm:p-7" : "border-vds-border bg-vds-surface"}`}>
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-vds-muted">
                <GroupIcon aria-hidden="true" className="size-4 shrink-0" />{item.group ?? "Revenue"}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{item.label}</h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-vds-foreground ${item.success ? "bg-vds-success-soft" : "bg-vds-elevated"}`}>
                  {item.success && <CheckCircle2 aria-hidden="true" className="size-3" />}{item.badge}
                </span>
              </div>
              <p className={`mt-5 break-words font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere] ${hero ? "text-4xl text-vds-primary sm:text-5xl" : "text-2xl"}`}>{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-vds-muted">{hero && deals ? `${deals.displayValue} active opportunities ? ${item.detail}` : item.detail}</p>
              {trend !== undefined && (
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-vds-foreground">
                  <TrendIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{trendState} ? {trend > 0 ? "+" : ""}{trend}%<span className="block text-vds-muted">{item.trendLabel}</span></span>
                </p>
              )}
              {hero && (hasHistory ? (
                <svg viewBox="0 0 240 40" role="img" aria-label="New deal value over the last seven days" className="mt-4 h-10 w-full text-vds-primary">
                  <polyline points={history.map((value, point) => `${point / (history.length - 1) * 236 + 2},${38 - value / Math.max(...history, 1) * 34}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : <div aria-hidden="true" className="mt-4 h-10 rounded-lg border-b border-dashed border-vds-accent-border bg-vds-primary-soft" />)}
              {showAction && <Link href={item.href} prefetch={false} className="focus-ring mt-auto flex min-h-11 items-center justify-between gap-3 border-t border-vds-border pt-4 text-sm font-semibold">{item.action}<ArrowRight aria-hidden="true" className="size-4 shrink-0" /></Link>}
            </article>
          );
        })}
        <div className="flex min-w-0 flex-col rounded-2xl border border-dashed border-vds-accent-border bg-vds-primary-soft p-5 sm:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles aria-hidden="true" className="size-4 shrink-0" /><h3>Business Intelligence</h3></div>
          <p className="mt-5 text-xl font-semibold">Building Insights</p>
          <p className="mt-2 text-sm leading-6 text-vds-muted">Record your properties, leads, and follow-ups to build a clearer view of your business.</p>
          {setupEvidence.length > 0 && <ul aria-label="Completed setup steps" className="my-4 space-y-2 text-xs text-vds-muted">{setupEvidence.map((step) => <li className="flex items-start gap-2" key={step}><CheckCircle2 aria-hidden="true" className="size-3 shrink-0" />{step}</li>)}</ul>}
          <p className="mt-3 text-sm text-vds-muted">Use Getting Started above to continue your setup.</p>
        </div>
      </div>
      <div className="mt-5 border-t border-vds-border pt-4">
        <Link href="/vayon/analytics" prefetch={false} className="focus-ring flex min-h-12 items-center justify-between gap-3 rounded-xl border border-vds-border bg-vds-surface px-5 py-3 text-sm font-semibold transition hover:border-vds-accent-border hover:bg-vds-elevated motion-reduce:transition-none">Understand performance <ArrowRight aria-hidden="true" className="size-4 shrink-0" /></Link>
      </div>
    </section>
  );
}
