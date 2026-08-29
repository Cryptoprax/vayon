import {
  ApprovalList,
  GovernanceHeader,
} from "@/features/vayon/workflow-approval/components/GovernanceViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
export default function Page() {
  const data = new GovernanceService().dashboard();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GovernanceHeader
        title="Real Estate Approval Center"
        description="Review property, listing, pricing, commission, offer, assignment, campaign, publication, contract, description, and media decisions with evidence and audit history."
      />
      <section className="mb-6 rounded-2xl border border-vds-border bg-vds-surface p-5" aria-labelledby="approval-types-title">
        <h2 id="approval-types-title" className="font-semibold">Real estate approval types</h2>
        <p className="mt-2 text-sm leading-6 text-vds-muted">Publish Listing · Price Revision · Property Status · Commission · Discount · Offer Acceptance · Offer Rejection · Agent Assignment · Contract Approval · Marketing Campaign · Listing Removal · Media Approval</p>
      </section>
      <ApprovalList items={data.approvals} />
    </main>
  );
}
