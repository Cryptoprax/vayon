import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { WhatsAppDraftApprovalList } from "@/features/vayon/workflow-approval/components/WhatsAppDraftApprovalViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";

export const dynamic = "force-dynamic";

/**
 * Phase E4's minimal WhatsApp AI draft review surface, gated by the
 * WhatsApp entitlement (Professional+) -- not the general Approval
 * Workflows entitlement (Business+). See the Phase E4 report's
 * COMMERCIAL APPROVALS VS SAFETY APPROVALS section for why this is a
 * separate page/gate from /vayon/approvals rather than a filtered view of it.
 */
export default async function Page() {
  try {
    await requireEntitlement("whatsapp");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="whatsapp" label="WhatsApp" />;
    throw error;
  }
  const approvals = await (await GovernanceService.production()).approvals();
  const drafts = approvals.filter((item) => item.sourceType === "whatsapp_ai_draft" && item.actionType === "whatsapp.message.send");
  return (
    <WorkspaceContent>
      <WorkspaceHeader title="WhatsApp AI drafts" description="Review AI-generated WhatsApp replies before they are ever sent. Nothing here has been delivered to the customer." />
      <WhatsAppDraftApprovalList items={drafts} />
    </WorkspaceContent>
  );
}
