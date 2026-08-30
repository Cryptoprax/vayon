import Link from "next/link";
import { AlertTriangle, Building2, ChartNoAxesCombined, Lightbulb, Sparkles, UserRound, UsersRound } from "lucide-react";
import type { ExecutiveDashboardData } from "../types";

const property = ["Newest Listings", "High Performing Listings", "Listings Needing Photos", "Listings Missing Documents", "Listings Awaiting Approval", "Inactive Listings", "Expiring Listings", "Price Reduction Candidates", "Luxury Properties", "Commercial Properties", "Rental Inventory"];
const buyers = ["VIP Buyers", "Cash Buyers", "Mortgage Buyers", "Investors", "International Buyers", "Urgent Buyers", "Dormant Buyers", "Recently Active Buyers"];
const sellers = ["Ready to List", "Needs Documents", "Waiting Photography", "Awaiting Verification", "High Value Sellers", "Inactive Sellers"];
const agents = ["Properties Sold", "Revenue", "Appointments", "Response Time", "Conversion Rate", "Active Listings", "Lead Follow-up", "Customer Rating"];
const market = ["Average Property Price", "Price Trend", "Demand Trend", "Hot Locations", "Cold Locations", "Fastest Selling Areas", "Inventory Growth", "Rental Demand"];

export function RealEstateIntelligence({ data }: { readonly data: ExecutiveDashboardData }) {
  const recommendations = evidenceRecommendations(data);
  return <>
    <section className="rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-6" aria-labelledby="executive-board-entry"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-vds-primary">AI Executive Leadership Team</p><h2 id="executive-board-entry" className="mt-1 text-xl font-semibold">Executive Collaboration Board</h2><p className="mt-2 text-sm text-vds-muted">Review one coordinated morning brief, ranked decisions, conflicts, scorecards, and evidence from all five AI managers.</p><Link href="/vayon/ai/collaboration" className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-xl border border-vds-border px-3 text-sm font-medium">Open Executive Boardroom</Link></section>
    <section aria-labelledby="ai-matching-dashboard" className="rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-6"><div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-vds-primary">Buyer & property matching</p><h2 id="ai-matching-dashboard" className="mt-1 text-xl font-semibold">AI Matching Overview</h2></div><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{["Top AI Matches Today","New Buyer Matches","Properties Without Matches","High Probability Closings","Buyers Waiting","Properties Waiting"].map(label=><div className="rounded-2xl bg-vds-elevated p-4" key={label}><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-2 font-semibold">Unavailable</dd><p className="mt-1 text-xs text-vds-subtle">Waiting for authoritative match-run evidence</p></div>)}</dl></section>
    <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]" aria-label="AI business intelligence">
      <Panel title="AI business insights" eyebrow="Evidence-backed recommendations" icon={Sparkles}>
        {recommendations.length ? <ul className="grid gap-3 sm:grid-cols-2">{recommendations.map((item) => <li key={item.title} className="rounded-2xl border border-vds-border bg-vds-elevated p-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-2 text-xs leading-5 text-vds-muted">Evidence: {item.evidence}</p><Link href={item.href} className="focus-ring mt-3 inline-flex rounded-lg text-xs font-semibold text-vds-primary">Review records →</Link></li>)}</ul> : <Unavailable text="Recommendations unavailable. Governed activity has not produced enough evidence." />}
      </Panel>
      <Panel title="AI command center" eyebrow="What should I do next?" icon={Lightbulb}>
        <dl className="grid gap-3 sm:grid-cols-2">{["Today's Priorities", "Recommended Actions", "Risk Alerts", "Growth Opportunities", "Urgent Tasks"].map((label) => <div className="rounded-2xl border border-vds-border bg-vds-elevated p-4" key={label}><dt className="text-xs font-semibold text-vds-secondary">{label}</dt><dd className="mt-2 text-xs leading-5 text-vds-muted">{commandValue(label, data)}</dd></div>)}</dl>
      </Panel>
    </section>
    <section className="grid gap-5 xl:grid-cols-2" aria-label="Real estate portfolio intelligence">
      <CategoryPanel title="Property intelligence" icon={Building2} items={property} empty="No active listing intelligence is available." href="/vayon/properties" />
      <CategoryPanel title="Buyer intelligence" icon={UserRound} items={buyers} empty="No buyer segments are available." href="/vayon/leads" />
      <CategoryPanel title="Seller intelligence" icon={UsersRound} items={sellers} empty="No seller segments are available." href="/vayon/leads" />
      <CategoryPanel title="Agent performance" icon={ChartNoAxesCombined} items={agents} empty="Agent leaderboard data is unavailable." href="/vayon/analytics/sales" />
    </section>
    <Panel title="Market intelligence" eyebrow="External and workspace market evidence" icon={ChartNoAxesCombined}>
      <p className="mb-4 rounded-2xl border border-dashed border-vds-border p-4 text-sm text-vds-muted">Market data unavailable. No authoritative market-data provider is connected.</p>
      <MetricList items={market} />
    </Panel>
  </>;
}

function evidenceRecommendations(data: ExecutiveDashboardData) {
  const items: { title: string; evidence: string; href: string }[] = [];
  const tasks = data.calendar.filter((item) => item.kind === "task");
  const visits = data.calendar.filter((item) => item.kind === "visit");
  const approvals = data.notifications.filter((item) => /approval/i.test(item.category));
  if (tasks.length) items.push({ title: "Complete today's due tasks", evidence: `${tasks.length} verified task${tasks.length === 1 ? " is" : "s are"} due today.`, href: "/vayon/tasks" });
  if (visits.length) items.push({ title: "Prepare for today's property viewings", evidence: `${visits.length} verified site visit${visits.length === 1 ? " is" : "s are"} scheduled.`, href: "/vayon/site-visits" });
  if (approvals.length) items.push({ title: "Review pending approvals", evidence: `${approvals.length} unread approval notification${approvals.length === 1 ? " exists" : "s exist"}.`, href: "/vayon/approvals" });
  if (data.ai.recommendations) items.push({ title: "Review property recommendations", evidence: `${data.ai.recommendations} governed recommendation${data.ai.recommendations === 1 ? " is" : "s are"} available.`, href: "/vayon/intelligence" });
  return items;
}

function commandValue(label: string, data: ExecutiveDashboardData) {
  if (label === "Today's Priorities") return data.calendar.length ? `${data.calendar.length} verified agenda items require review.` : "Waiting for activity.";
  if (label === "Recommended Actions") return data.ai.recommendations ? `${data.ai.recommendations} governed AI recommendations available.` : "Unavailable — no recommendation evidence.";
  if (label === "Urgent Tasks") { const count = data.notifications.filter((item) => item.priority === "urgent").length; return count ? `${count} urgent notification${count === 1 ? "" : "s"} require attention.` : "No verified urgent alerts."; }
  return "Unavailable — not enough authoritative evidence.";
}

function CategoryPanel({ title, icon, items, empty, href }: { readonly title: string; readonly icon: typeof Building2; readonly items: readonly string[]; readonly empty: string; readonly href: string }) {
  return <Panel title={title} eyebrow="Verified workspace segmentation" icon={icon}><Unavailable text={empty} /><MetricList items={items} /><Link href={href} className="focus-ring mt-4 inline-flex text-xs font-semibold text-vds-primary">Open workspace →</Link></Panel>;
}
function MetricList({ items }: { readonly items: readonly string[] }) { return <dl className="grid gap-2 sm:grid-cols-2">{items.map((item) => <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-vds-elevated px-3 py-2.5" key={item}><dt className="truncate text-xs text-vds-muted">{item}</dt><dd className="shrink-0 text-xs font-semibold text-vds-subtle">Unavailable</dd></div>)}</dl>; }
function Unavailable({ text }: { readonly text: string }) { return <p className="mb-4 flex items-start gap-2 rounded-2xl border border-dashed border-vds-border p-4 text-xs leading-5 text-vds-muted"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{text}</p>; }
function Panel({ title, eyebrow, icon: Icon, children }: { readonly title: string; readonly eyebrow: string; readonly icon: typeof Building2; readonly children: React.ReactNode }) { return <section className="min-w-0 rounded-3xl border border-vds-border bg-vds-surface p-5 sm:p-6" aria-labelledby={`dashboard-${title.toLowerCase().replaceAll(" ", "-")}`}><header className="mb-5 flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-vds-primary">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold" id={`dashboard-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h2></div></header>{children}</section>; }
