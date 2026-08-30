import type { DealRecord } from "../types";
import { WorkspaceEmptyState, WorkspaceOverview } from "@/features/vayon/workspace-engine/components";
import Link from "next/link";

export function DealOverview({ deal }: { deal: DealRecord }) {
  return <div className="space-y-5"><WorkspaceOverview widgets={[
    { id: "progress", title: "Transaction Progress", value: `${deal.probability}%`, order: 1, size: "medium" },
    { id: "stage", title: "Current Stage", value: deal.stageName, order: 2, size: "medium" },
    { id: "property", title: "Property", value: deal.propertyName ?? "Not linked", order: 3, size: "medium" },
    { id: "buyer", title: "Buyer", value: deal.leadName ?? "Not linked", order: 4, size: "medium" },
    { id: "seller", title: "Seller", value: "Unavailable", order: 5, size: "small" },
    { id: "owner", title: "Assigned Agent", value: deal.assignedAgentName ?? "Unassigned", order: 6, size: "small" },
    { id: "commission", title: "Commission", value: "Unavailable", order: 7, size: "small" },
    { id: "closing", title: "Expected Closing", value: deal.closingDate ?? "Not set", order: 8, size: "small" },
    { id: "documents", title: "Pending Documents", value: "Unavailable", order: 9, size: "small" },
    { id: "loan", title: "Loan Status", value: "Unavailable", order: 10, size: "small" },
    { id: "registration", title: "Registration Status", value: "Unavailable", order: 11, size: "small" },
    { id: "approvals", title: "Approvals", value: "Unavailable", order: 12, size: "small" },
    { id: "risk", title: "Risk Level", value: "Unavailable", order: 13, size: "small" },
    { id: "value", title: "Transaction Value", value: deal.value ? `${deal.value.amount.toLocaleString()} ${deal.value.currency}` : "Unavailable", order: 14, size: "medium" },
  ]} /><section className="rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="transaction-sales-copilot"><div className="flex flex-wrap justify-between gap-3"><div><h2 id="transaction-sales-copilot" className="font-semibold">Transaction Sales Copilot</h2><p className="mt-1 text-sm text-vds-muted">Recommendation only · approval required</p></div><span className="text-xs uppercase text-vds-muted">{deal.closingDate ? "Medium confidence" : "Low confidence"}</span></div><dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm"><div><dt className="text-xs text-vds-muted">Next Best Action</dt><dd className="mt-1">{deal.closingDate ? "Confirm the next closing commitment" : "Set an expected closing date"}</dd></div><div><dt className="text-xs text-vds-muted">Follow-up detection</dt><dd className="mt-1">Registration and mortgage dates unavailable</dd></div><div><dt className="text-xs text-vds-muted">Risk</dt><dd className="mt-1">Documents, loan, and registration evidence missing</dd></div><div><dt className="text-xs text-vds-muted">Pending questions</dt><dd className="mt-1">Who owns the next customer commitment?</dd></div></dl><div className="mt-4 flex flex-wrap gap-2">{[["request_documents", "Request Documents"], ["mortgage_follow_up", "Mortgage Follow-up"], ["registration_follow_up", "Registration Follow-up"]].map(([intent, label]) => <Link key={intent} className="min-h-11 rounded-xl border border-vds-border px-3 py-3 text-sm focus-ring" href={`/vayon/approvals?intent=${intent}&source=transaction-sales-copilot&deal=${deal.id}`}>{label}</Link>)}</div></section></div>;
}

export function DealPanel({ name }: { name: string }) {
  const details: Record<string, string> = { customer: "Connected buyer or seller, intent, budget, and requirements.", property: "Selected property, alternatives, and reservation status.", "site-visits": "Viewing schedule, outcomes, notes, and follow-up.", offers: "Offer amount, status, acceptance, counter, and expiry.", payments: "Booking, deposit, installments, balance, and upcoming payments.", commission: "Internal, agent, broker, and referral commission status.", documents: "Booking forms, agreements, invoices, receipts, and legal documents.", messages: "Connected WhatsApp, email, and SMS conversations.", meetings: "Buyer, seller, viewing, and registration meetings." };
  return <WorkspaceEmptyState title={name.replace("-", " ")} description={details[name] ?? "Ready for verified transaction records."} />;
}
