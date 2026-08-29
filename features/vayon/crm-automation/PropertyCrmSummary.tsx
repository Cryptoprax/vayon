import Link from "next/link";
import type { PropertyCrmDashboard } from "./domain";

export function PropertyCrmSummary({ model }: { model: PropertyCrmDashboard }) {
  const metrics = [
    ["Interested Leads", model.interestedLeads], ["Viewing Requests", model.viewingRequests],
    ["Saved By", model.savedBy], ["Hot Prospects", model.hotProspects],
    ["Average Match Score", `${model.averageMatchScore.toFixed(1)}%`],
    ["Conversion", `${model.conversion.toFixed(1)}%`], ["Offers", model.offers], ["Owner", model.owner],
  ];

  return (
    <section className="mx-auto mb-6 max-w-[96rem] px-5" aria-labelledby="property-crm-title">
      <h2 id="property-crm-title" className="sr-only">Property CRM intelligence</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value]) => <article key={label} className="rounded-2xl border border-vds-border bg-vds-surface p-4">
          <p className="text-xs text-vds-muted">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p>
        </article>)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-vds-border bg-vds-surface p-5">
          <h3 className="font-semibold">Interested Leads</h3>
          <div className="mt-3 space-y-2">
            {model.prospects.length ? model.prospects.map((item) => <Link key={item.id} href={`/vayon/crm/leads/${item.id}`} className="flex justify-between rounded-xl bg-vds-elevated p-3 text-sm focus-ring">
              <span>{item.name} · <span className="capitalize text-vds-muted">{item.interest}</span></span><strong>{item.score}%</strong>
            </Link>) : <p className="text-sm text-vds-muted">No matching prospects yet. Update buyer requirements to generate matches.</p>}
          </div>
        </article>
        <article className="rounded-2xl border border-vds-border bg-vds-surface p-5">
          <h3 className="font-semibold">Timeline</h3>
          <div className="mt-3 space-y-2">
            {model.timeline.length ? model.timeline.slice(0, 8).map((item) => <div key={item.id} className="rounded-xl bg-vds-elevated p-3">
              <p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-vds-muted">{new Date(item.occurredAt).toLocaleString()}</p>
            </div>) : <p className="text-sm text-vds-muted">Property activity will appear here after the first buyer interaction.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
