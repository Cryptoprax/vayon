"use client";
import { useState } from "react";
import { Button, ButtonLink } from "@/features/platform/design-system";
import type { CrmLeadProfile } from "../domain/contracts";
import { salesCopilotActions } from "@/features/vayon/real-estate-experience/catalog";
const tabs = [
  "overview",
  "timeline",
  "properties",
  "deals",
  "communications",
  "emails",
  "calls",
  "whatsapp",
  "meetings",
  "tasks",
  "documents",
  "notes",
  "revenue",
  "pipeline history",
  "ai insights",
  "ai assistant",
] as const;
export function CrmLeadProfileView({ profile }: { profile: CrmLeadProfile }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("overview");
  const { lead, insights } = profile;
  const related =
    tab === "properties"
      ? profile.properties
      : tab === "deals"
        ? profile.deals
        : tab === "meetings"
          ? profile.meetings
          : tab === "tasks"
            ? profile.tasks
            : profile.documents;
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-vds-border bg-vds-surface p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-vds-primary-soft text-lg font-semibold text-vds-primary">
                {lead.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2 className="text-2xl font-semibold">{lead.name}</h2>
                <p className="text-sm text-vds-muted">
                  {lead.phone} · {lead.email ?? "No email"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-vds-primary-soft px-3 py-1 text-vds-primary">
                {lead.status}
              </span>
              <span className="rounded-full border border-vds-border px-3 py-1">
                {lead.priority} priority
              </span>
              <span className="rounded-full border border-vds-border px-3 py-1">
                Score {lead.aiScore ?? 0}
              </span>
              <span className="rounded-full border border-vds-border px-3 py-1 capitalize">{lead.interestLevel} interest</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/vayon/communications?lead=${lead.id}`}>
              WhatsApp / Email
            </ButtonLink>
            <ButtonLink variant="outline" href={`/vayon/deals?lead=${lead.id}`}>
              Create deal
            </ButtonLink>
            <Button variant="outline" onClick={() => setTab("timeline")}>
              Add note
            </Button>
          </div>
        </div>
      </section>
      <section aria-label="Client intelligence" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Buyer / Seller Profile", profile.buyingPurpose ?? "Not captured"],
          ["Intent Score", `${lead.aiScore ?? 0}/100`],
          ["Urgency Score", insights.urgency],
          ["Budget Confidence", insights.budgetConfidence],
          ["Mortgage Status", "Not captured"],
          ["Preferred Communities", profile.preferredLocations.join(", ") || "Not captured"],
          ["Preferred Builders", "Not captured"],
          ["Property Matches", `${profile.recommendations.length} verified`],
          ["Viewing History", `${profile.meetings.length} recorded`],
          ["Communication Summary", insights.summary],
          ["AI Next Best Action", lead.nextRecommendedAction],
          ["Assigned Agent", profile.owner],
        ].map(([label, value]) => <article key={label} className="rounded-2xl border border-vds-border bg-vds-surface p-4"><p className="text-xs text-vds-muted">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></article>)}
      </section>
      <div className="flex gap-1 overflow-x-auto border-b border-vds-border">
        {tabs.map((x) => (
          <Button
            key={x}
            variant="control"
            onClick={() => setTab(x)}
            className={`vds-focus shrink-0 border-b-2 px-3 py-3 text-sm capitalize ${tab === x ? "border-vds-primary text-vds-primary" : "border-transparent text-vds-muted"}`}
          >
            {x === "deals" ? "transactions" : x}
          </Button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Info
            title="Qualification"
            values={[
              ["Budget", lead.budgetLabel],
              ["Purpose", profile.buyingPurpose ?? "Not captured"],
              [
                "Locations",
                profile.preferredLocations.join(", ") || "Not captured",
              ],
              ["Property type", lead.propertyType ?? "Not captured"],
            ]}
          />
          <Info
            title="Ownership"
            values={[
              ["Owner", profile.owner],
              ["Source", lead.source],
              ["Interest", lead.propertyInterest],
              ["Pipeline stage", lead.pipelineStage.replaceAll("_", " ")],
              ["Created", new Date(lead.createdAt).toLocaleDateString()],
            ]}
          />
          <Info
            title="Next best action"
            values={[
              ["Recommendation", lead.nextRecommendedAction],
              ["Reason", lead.intelligenceReason],
              ["Confidence", `${lead.intelligenceConfidence}%`],
              ["Last updated", new Date(lead.intelligenceUpdatedAt).toLocaleString()],
              ["Risk", insights.risk],
              ["Budget confidence", insights.budgetConfidence],
            ]}
          />
        </div>
      )}
      {(tab === "timeline" || tab === "communications") && (
        <Timeline
          items={tab === "timeline" ? profile.timeline : profile.communications}
        />
      )}{" "}
      {(tab === "emails" || tab === "calls" || tab === "whatsapp" || tab === "notes") && <Timeline items={profile.timeline.filter(item => item.kind === (tab === "emails" ? "email" : tab === "calls" ? "call" : tab === "notes" ? "note" : "whatsapp"))}/>}
      {(tab === "properties" ||
        tab === "deals" ||
        tab === "meetings" ||
        tab === "tasks" ||
        tab === "documents") && (
        tab === "properties" ? <section aria-labelledby="top-matching-properties"><h2 id="top-matching-properties" className="mb-4 text-xl font-semibold">Top Matching Properties</h2><PropertyRecommendations items={profile.recommendations}/><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["Recently Improved Matches","Waiting for match history"],["New Listings","Waiting for listing activity"],["Expired Matches","No expired match evidence"]].map(([label,value])=><div key={label} className="rounded-xl border border-vds-border bg-vds-surface p-4"><p className="text-xs font-semibold">{label}</p><p className="mt-2 text-xs text-vds-muted">{value}</p></div>)}</div></section> : <div className="grid gap-3">
          {related.length ? (
            related.map((x) => (
              <article
                key={x.id}
                className="rounded-xl border border-vds-border bg-vds-surface p-4"
              >
                <p className="font-medium">{x.title}</p>
                <p className="mt-1 text-xs text-vds-muted">
                  {x.kind} · {x.status}
                  {x.meta ? ` · ${x.meta}` : ""}
                </p>
              </article>
            ))
          ) : (
            <Empty label={tab} />
          )}
        </div>
      )}
      {tab === "ai insights" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Info
            title="Deterministic intelligence"
            values={[
              ["Summary", insights.summary],
              ["Buying intent", insights.buyingIntent],
              ["Urgency", insights.urgency],
              ["Generated by", insights.generatedBy],
              ["Evidence", lead.intelligenceEvidence.length ? lead.intelligenceEvidence.map(item=>`${item.signal} (+${item.weight})`).join(", ") : "No supporting signals recorded"],
            ]}
          />
          <Info
            title="Suggested outreach"
            values={[
              ["WhatsApp", insights.suggestedWhatsApp],
              ["Email", insights.suggestedEmail],
              ["Call", insights.suggestedCallScript],
            ]}
          />
        </div>
      )}
      {tab === "revenue" && <Info title="Revenue attribution" values={profile.deals.length ? profile.deals.map(deal => [deal.title, deal.meta ?? "Authoritative value unavailable"] as const) : [["Revenue", "No authoritative deal revenue is linked to this customer."]]}/>}
      {tab === "pipeline history" && <div className="grid gap-3">{profile.deals.length ? profile.deals.map(deal => <article className="rounded-xl border border-vds-border bg-vds-surface p-4" key={deal.id}><p className="font-medium">{deal.title}</p><p className="mt-1 text-xs capitalize text-vds-muted">Current recorded stage · {deal.status}</p></article>) : <Empty label="pipeline history"/>}</div>}
      {tab === "ai assistant" && <AiAssistant leadId={lead.id} leadName={lead.name}/>}
    </div>
  );
}
const legacySalesActions = ["Summarize customer", "Generate follow-up", "Write proposal", "Generate email", "Meeting agenda", "Risk analysis", "Suggested next action"] as const;
function AiAssistant({leadId,leadName}:{leadId:string;leadName:string}) { const actions=[...salesCopilotActions,...legacySalesActions.filter(action=>!salesCopilotActions.some(current=>current.toLocaleLowerCase()===action.toLocaleLowerCase()))];return <section className="rounded-2xl border border-vds-accent-border bg-vds-primary-soft p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-vds-primary">Real Estate Sales Copilot · recommendation only · approval required</p><h3 className="mt-2 text-xl font-semibold">Assist with {leadName}</h3><p className="mt-2 text-sm leading-6 text-vds-muted">Prepare client communication, property recommendations, viewing plans, and transaction documents using the existing governed AI runtime. No message, proposal, meeting, or CRM change is executed automatically.</p><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{actions.map(label=><ButtonLink key={label} variant="outline" href={`/vayon/ai/workforce/sales-ai?customer=${encodeURIComponent(leadId)}&prompt=${encodeURIComponent(`${label} using only verified workspace evidence. Prepare for human approval and do not execute.`)}`} className="justify-start text-left">{label}</ButtonLink>)}</div></section>}
function Info({
  title,
  values,
}: {
  title: string;
  values: readonly (readonly [string, string])[];
}) {
  return (
    <section className="rounded-2xl border border-vds-border bg-vds-surface p-5">
      <h3 className="font-semibold">{title}</h3>
      <dl className="mt-4 space-y-3">
        {values.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-vds-muted">{k}</dt>
            <dd className="mt-1 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
function Timeline({ items }: { items: CrmLeadProfile["timeline"] }) {
  return (
    <div className="space-y-3">
      {items.length ? (
        items.map((x) => (
          <article
            key={x.id}
            className="rounded-xl border border-vds-border bg-vds-surface p-4"
          >
            <p className="font-medium">{x.title}</p>
            <p className="mt-1 text-xs text-vds-muted">
              {x.kind} · {new Date(x.occurredAt).toLocaleString()}
            </p>
            {x.detail && (
              <p className="mt-2 text-sm text-vds-muted">{x.detail}</p>
            )}
          </article>
        ))
      ) : (
        <Empty label="timeline events" />
      )}
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-vds-border p-12 text-center text-sm text-vds-muted">
      No {label} are available for this lead yet.
    </div>
  );
}
function PropertyRecommendations({items}:{items:CrmLeadProfile["recommendations"]}){return <div className="grid gap-4 lg:grid-cols-2">{items.length?items.map(item=><article key={item.id} className="rounded-2xl border border-vds-border bg-vds-surface p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-vds-muted">{item.reference} · {item.location}</p></div><strong className="rounded-full bg-vds-primary-soft px-3 py-1 text-sm text-vds-primary">{item.overallScore}% Match</strong></div><p className="mt-4 text-sm font-medium">{item.price}</p><p className="mt-1 text-xs capitalize text-vds-muted">{item.bedrooms??"—"} bedrooms · {item.area??"—"} area · {item.status}</p><dl className="mt-4 grid grid-cols-2 gap-2 text-xs">{[["Budget",item.budgetScore],["Location",item.locationScore],["Bedrooms",item.bedroomScore],["Property Type",item.propertyTypeScore],["Availability",item.availabilityScore],["Investment",item.investmentScore],["Rental",item.rentalScore],["Lifestyle",item.lifestyleScore]].map(([label,value])=><div key={label} className="rounded-lg bg-vds-elevated p-2"><dt className="text-vds-muted">{label}</dt><dd className="mt-1 font-semibold">{value}%</dd></div>)}</dl><p className="mt-4 text-sm text-vds-muted">{item.recommendation}</p></article>):<Empty label="matching properties"/>}</div>}
