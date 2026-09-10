import Link from "next/link";
import { Sparkles } from "lucide-react";
import { resolveOperatingSystemCommand } from "./command-router";

type ContextKind = "property" | "lead" | "client" | "company" | "deal" | "dashboard";
const actions: Record<ContextKind, readonly string[]> = {
  deal: ["Generate Agreement", "Create Follow-up", "Review Performance"],
  property: ["Generate Brochure", "Find Buyers", "Schedule Viewing", "Generate Flyer", "Generate Presentation", "Generate Property Video", "Generate Social Campaign", "Generate Facebook Ads", "Generate Google Ads", "Generate Landing Page", "Generate Email Campaign", "Generate WhatsApp Campaign", "Improve Listing Description", "Generate SEO Content", "Generate QR Code", "Generate Open House Kit", "Estimate Marketing Budget"],
  lead: ["Create Follow-up", "Recommend Properties", "Schedule Viewing", "Call Lead", "WhatsApp Lead", "Email Lead", "Generate Proposal", "Book Viewing", "Create Follow-up Campaign", "Generate Closing Strategy", "Summarize Conversation", "Risk Analysis"],
  client: ["Generate Property Portfolio", "Recommend Investments", "Create Follow-up", "Generate Newsletter", "Referral Campaign"],
  company: ["Generate Company Presentation", "Marketing Strategy", "Recruitment Campaign", "Expansion Report"],
  dashboard: ["Generate New Campaign", "Launch Follow-up", "Increase Marketing Budget", "Recommend Top 3 Properties", "Review Performance"],
};

type Evidence = { readonly description?: string; readonly published?: boolean; readonly phone?: string; readonly email?: string; readonly stage?: string; readonly status?: string; readonly leadId?: string };

export function nextEntityAction(kind: ContextKind, recordId: string | undefined, evidence?: Evidence) {
  if (!recordId || !evidence) return undefined;
  const id = encodeURIComponent(recordId);
  if (kind === "property") return !evidence.description?.trim()
    ? { label: "Complete property details", reason: "This property has no description recorded.", href: `/vayon/properties/${id}/edit` }
    : { label: "Prepare property marketing", reason: evidence.published ? "This listing is published. Review its marketing before sharing." : "A description is recorded. Review the listing before preparing marketing.", href: `/vayon/creative/documents?propertyId=${id}` };
  if (kind === "lead") return !evidence.phone && !evidence.email
    ? { label: "Add contact details", reason: "No phone number or email is recorded for this lead.", href: `/vayon/leads/${id}/edit` }
    : { label: "Review follow-up tasks", reason: "Contact details are recorded. Check existing tasks before planning the next conversation.", href: `/vayon/tasks?leadId=${id}` };
  if (kind === "deal") return evidence.stage === "completed" || evidence.status === "won"
    ? { label: "Prepare closing paperwork", reason: "This deal is marked complete. Review the existing document tool and check for prior paperwork before creating more.", href: `/vayon/creative/documents?dealId=${id}` }
    : { label: "Review deal tasks", reason: "Check the tasks already recorded for this deal before planning its next step.", href: `/vayon/tasks?dealId=${id}` };
  if (kind === "client" && evidence.leadId) return { label: "Review linked lead", reason: "This client has a linked lead. Continue with its recorded requirements and follow-ups.", href: `/vayon/leads/${encodeURIComponent(evidence.leadId)}` };
  if (kind === "client") return { label: "Record client requirements", reason: "No linked lead is recorded for this client. Add buying or selling requirements when relevant.", href: "/vayon/leads/new" };
  return undefined;
}

export function ContextualAIActions({ kind, recordId, recordLabel, heading, evidence }: { readonly kind: ContextKind; readonly recordId?: string; readonly recordLabel?: string; readonly heading?: string; readonly evidence?: Evidence }) {
  const next = nextEntityAction(kind, recordId, evidence);
  const renderAction = (label: string) => {
    const prompt = `${label}${recordLabel ? ` for ${recordLabel}` : ""}`;
    const command = resolveOperatingSystemCommand(prompt);
    const query = new URL(command.route, "https://vayon.invalid");
    if (recordId) query.searchParams.set(`${kind}Id`, recordId);
    return <Link key={label} href={`${query.pathname}${query.search}`} className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-vds-border bg-vds-elevated px-3 text-sm hover:border-vds-accent-border hover:text-vds-primary">{label}{command.approvalRequired && <span className="sr-only"> Requires approval</span>}</Link>;
  };
  return <aside className="mx-auto my-6 max-w-[96rem] rounded-3xl border border-vds-accent-border bg-vds-surface p-5 sm:p-6" aria-labelledby={`ai-actions-${kind}`}>
    <h2 className="flex items-center gap-2 font-semibold" id={`ai-actions-${kind}`}><Sparkles className="size-5 text-vds-primary" aria-hidden="true" />{heading ?? "Next Best Action"}</h2>
    <p className="mt-2 text-sm text-vds-muted">{next ? `Suggested: ${next.reason}` : "Review this record before choosing a next step. No prepared work is confirmed by the information shown here."}</p>
    <div className="mt-4 flex flex-wrap gap-2">{next && <Link href={next.href} className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-vds-border px-3 text-sm hover:text-vds-primary">{next.label}</Link>}</div>
    {actions[kind].length > 0 && <details className="mt-3"><summary className="focus-ring flex min-h-11 cursor-pointer items-center rounded-lg text-sm font-medium">More actions for this {kind}</summary><div className="mt-2 flex flex-wrap gap-2">{actions[kind].map(renderAction)}</div></details>}
  </aside>;
}
