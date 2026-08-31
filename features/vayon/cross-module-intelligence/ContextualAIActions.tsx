import Link from "next/link";
import { Sparkles } from "lucide-react";
import { resolveOperatingSystemCommand } from "./command-router";

type ContextKind = "property" | "lead" | "client" | "company" | "dashboard";
const actions: Record<ContextKind, readonly string[]> = {
  property: ["Generate Brochure", "Generate Flyer", "Generate Presentation", "Generate Property Video", "Generate Social Campaign", "Generate Facebook Ads", "Generate Google Ads", "Generate Landing Page", "Generate Email Campaign", "Generate WhatsApp Campaign", "Improve Listing Description", "Generate SEO Content", "Generate QR Code", "Generate Open House Kit", "Estimate Marketing Budget"],
  lead: ["Call Lead", "WhatsApp Lead", "Email Lead", "Generate Proposal", "Recommend Properties", "Book Viewing", "Create Follow-up Campaign", "Generate Closing Strategy", "Summarize Conversation", "Risk Analysis"],
  client: ["Generate Property Portfolio", "Recommend Investments", "Create Follow-up", "Generate Newsletter", "Referral Campaign"],
  company: ["Generate Company Presentation", "Marketing Strategy", "Recruitment Campaign", "Expansion Report"],
  dashboard: ["Generate New Campaign", "Launch Follow-up", "Increase Marketing Budget", "Recommend Top 3 Properties", "Review Performance"],
};

export function ContextualAIActions({ kind, recordId, recordLabel }: { readonly kind: ContextKind; readonly recordId?: string; readonly recordLabel?: string }) {
  return <aside className="mx-auto my-6 max-w-[96rem] rounded-3xl border border-vds-accent-border bg-vds-surface p-5 sm:p-6" aria-labelledby={`ai-actions-${kind}`}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary"><Sparkles className="size-5" aria-hidden="true" /></span><div><h2 className="font-semibold" id={`ai-actions-${kind}`}>AI Actions</h2><p className="mt-1 text-xs text-vds-muted">Context-aware recommendations · approval governance preserved</p></div></div><div className="mt-5 flex flex-wrap gap-2">{actions[kind].map((label) => { const prompt = `${label}${recordLabel ? ` for ${recordLabel}` : ""}`, command = resolveOperatingSystemCommand(prompt), query = new URL(command.route, "https://vayon.invalid"); if (recordId) query.searchParams.set(`${kind}Id`, recordId); return <Link key={label} href={`${query.pathname}${query.search}`} className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm hover:border-vds-accent-border hover:text-vds-primary">{label}{command.approvalRequired ? <span className="sr-only"> Requires approval</span> : null}</Link>; })}</div><dl className="mt-5 grid gap-3 border-t border-vds-divider pt-4 text-xs sm:grid-cols-2 lg:grid-cols-5">{[["Specialist", specialist(kind)], ["Risks", "Evidence required"], ["Recent AI Activity", "Workspace history"], ["Approval Status", "Governed per action"], ["Suggested Automations", "Prepared, never automatic"]].map(([term, value]) => <div key={term}><dt className="text-vds-subtle">{term}</dt><dd className="mt-1 text-vds-muted">{value}</dd></div>)}</dl></aside>;
}
function specialist(kind: ContextKind) { return kind === "property" ? "Property AI" : kind === "lead" ? "Sales AI" : kind === "dashboard" ? "Executive AI" : "Customer AI"; }
