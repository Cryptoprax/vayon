import type { DealRecord } from "../types";
import { WorkspaceEmptyState, WorkspaceOverview } from "@/features/vayon/workspace-engine/components";

export function DealOverview({ deal }: { deal: DealRecord }) {
  return <WorkspaceOverview widgets={[
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
  ]} />;
}

export function DealPanel({ name }: { name: string }) {
  const details: Record<string, string> = { customer: "Connected buyer or seller, intent, budget, and requirements.", property: "Selected property, alternatives, and reservation status.", "site-visits": "Viewing schedule, outcomes, notes, and follow-up.", offers: "Offer amount, status, acceptance, counter, and expiry.", payments: "Booking, deposit, installments, balance, and upcoming payments.", commission: "Internal, agent, broker, and referral commission status.", documents: "Booking forms, agreements, invoices, receipts, and legal documents.", messages: "Connected WhatsApp, email, and SMS conversations.", meetings: "Buyer, seller, viewing, and registration meetings." };
  return <WorkspaceEmptyState title={name.replace("-", " ")} description={details[name] ?? "Ready for verified transaction records."} />;
}
