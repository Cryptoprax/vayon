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
          <h3 className="font-semibold">Top Matching Buyers</h3>
          <div className="mt-3 space-y-2">
            {model.prospects.length ? model.prospects.map((item) => <Link key={item.id} href={`/vayon/crm/leads/${item.id}`} className="flex justify-between rounded-xl bg-vds-elevated p-3 text-sm focus-ring">
              <span>{item.name} · <span className="capitalize text-vds-muted">{item.interest}</span><span className="mt-1 block text-xs text-vds-muted">Why this buyer qualifies: verified CRM interest · Next Recommended Action: Call Buyer</span></span><strong>{item.score}% AI Match Score</strong>
            </Link>) : <p className="text-sm text-vds-muted">No matching prospects yet. Update buyer requirements to generate matches.</p>}
          </div><dl className="mt-4 grid grid-cols-2 gap-2 text-xs">{["Hot Buyers","VIP Buyers","Cash Buyers","Investment Buyers"].map(label=><div className="rounded-xl bg-vds-elevated p-3" key={label}><dt>{label}</dt><dd className="mt-1 text-vds-muted">Unavailable · classification evidence missing</dd></div>)}</dl>
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
      <article className="mt-4 rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="property-sales-copilot">
        <div className="flex flex-wrap justify-between gap-3"><div><h3 id="property-sales-copilot" className="font-semibold">Property Sales Copilot</h3><p className="mt-1 text-sm text-vds-muted">Recommendation only · approval required</p></div><span className="text-xs uppercase text-vds-muted">{model.prospects.length ? "Medium confidence" : "Unknown confidence"}</span></div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm"><div><dt className="text-xs text-vds-muted">Next Best Action</dt><dd className="mt-1">{model.prospects.length ? "Review the top matching buyer" : "Capture buyer requirements"}</dd></div><div><dt className="text-xs text-vds-muted">Follow-up detection</dt><dd className="mt-1">{model.viewingRequests ? `${model.viewingRequests} viewing requests need review` : "No verified follow-up due"}</dd></div><div><dt className="text-xs text-vds-muted">Risk</dt><dd className="mt-1">{model.prospects.length ? "Buyer intent requires human validation" : "Missing buyer evidence"}</dd></div><div><dt className="text-xs text-vds-muted">Missing information</dt><dd className="mt-1">Conversation, offer expiry, and pricing review dates</dd></div></dl>
        <div className="mt-4 flex flex-wrap gap-2"><Link className="min-h-11 rounded-xl border border-vds-border px-3 py-3 text-sm focus-ring" href="/vayon/approvals?intent=send_brochure&source=property-sales-copilot">Prepare Brochure</Link><Link className="min-h-11 rounded-xl border border-vds-border px-3 py-3 text-sm focus-ring" href="/vayon/approvals?intent=schedule_viewing&source=property-sales-copilot">Prepare Viewing</Link><Link className="min-h-11 rounded-xl border border-vds-border px-3 py-3 text-sm focus-ring" href="/vayon/approvals?intent=prepare_offer&source=property-sales-copilot">Prepare Offer</Link></div>
      </article>
    </section>
  );
}
