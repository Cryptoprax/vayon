import type { CrmAutomationDashboard } from "./domain";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

export function SalesAutomationSummary({ model }: { model: CrmAutomationDashboard }) {
  const money = (value: number) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(value);
  const metrics = [
    ["Today's calls", model.todaysCalls], ["Today's meetings", model.todaysMeetings],
    ["Site visits", model.siteVisits], ["New leads", model.newLeads],
    ["Follow-ups due", model.followUpsDue], ["Pending deals", model.pendingDeals],
    ["Revenue forecast", money(model.revenueForecast)], ["Conversion", `${model.conversion.toFixed(1)}%`],
  ];
  const insights = [
    ["Average days to close", model.averageDaysToClose.toFixed(1)],
    ["Average buyer budget", money(model.averageBudget)],
    ["Most requested locations", model.topLocations.join(", ")],
    ["Most requested property types", model.topPropertyTypes.join(", ")],
    ["Top salesperson", model.topSalesperson], ["Top company", model.topCompany],
    ["Top lead source", model.topLeadSource], ["Monthly revenue", money(model.monthlyRevenue)],
  ];

  return (
    <section className="space-y-5" aria-labelledby="automation-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Live CRM intelligence</p>
        <h2 id="automation-title" className="mt-2 text-2xl font-semibold">Today&apos;s sales activity</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <article className={card} key={label}>
          <p className="text-xs text-vds-muted">{label}</p><p className="mt-3 text-xl font-semibold">{value}</p>
        </article>)}
      </div>
      <section className={card} aria-labelledby="intelligence-title">
        <h3 id="intelligence-title" className="font-semibold">Business intelligence</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insights.map(([label, value]) => <div key={label}>
            <dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd>
          </div>)}
        </dl>
      </section>
    </section>
  );
}
