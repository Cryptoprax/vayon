import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { notFound } from "next/navigation";
import { WhatsAppDraftApprovalDetail } from "@/features/vayon/workflow-approval/components/WhatsAppDraftApprovalViews";
import { GovernanceService } from "@/features/vayon/workflow-approval/services/governance.service";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
import { EntitlementUpgradeRequired } from "@/features/vayon/billing/components/EntitlementUpgradeRequired";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { resolveWhatsAppDraftSendEligibility } from "@/features/platform/integrations/whatsapp/whatsapp-draft-send-eligibility.service";
import { WorkforceConversationRepository } from "@/features/platform/openai/runtime/repository";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ approvalId: string }> }) {
  try {
    await requireEntitlement("whatsapp");
  } catch (error) {
    if (error instanceof FeatureNotEntitledError) return <EntitlementUpgradeRequired feature="whatsapp" label="WhatsApp" />;
    throw error;
  }
  const { approvalId } = await params;
  const permissions = new WorkspacePermissionService();
  const [result, decideCheck] = await Promise.all([
    (await GovernanceService.production()).approval(approvalId),
    permissions.check("approvals", "approve"),
  ]);
  if (!result.approval || result.approval.sourceType !== "whatsapp_ai_draft" || result.approval.actionType !== "whatsapp.message.send") notFound();

  // Send state is derived from the same tenant-scoped eligibility check
  // Phase E5/E6's executor itself re-runs immediately before sending -- not
  // a separate, potentially-stale UI flag. "claimed"/"uncertain" (Phase E6)
  // never offer a send/retry action; "failed_retryable" (a prior attempt
  // failed) is the only state that shows Send Approved Reply as a retry.
  let sendState: "not_applicable" | "eligible" | "failed_retryable" | "claimed" | "uncertain" | "sent" = "not_applicable";
  // K6 completion: source refs (why the grounded draft said what it said) are
  // read back regardless of approval status -- viewing them is not a decision
  // action and does not affect send eligibility. Read-only, tenant-scoped by
  // organization_id/workspace_id/id; never the draft's extracted text/prompt.
  const sourceRefs = result.approval.sourceId
    ? await new WorkforceConversationRepository(await operationsContext()).sourceRefsForMessage(result.approval.sourceId).catch(() => [])
    : [];
  if (result.approval.status === "approved" && result.approval.sourceId) {
    const context = await operationsContext();
    const eligibility = await resolveWhatsAppDraftSendEligibility({ organizationId: context.organizationId, workspaceId: context.workspaceId, draftMessageId: result.approval.sourceId });
    if (eligibility.eligible) sendState = eligibility.retryOfFailedExecution ? "failed_retryable" : "eligible";
    else if (eligibility.reason === "already_sent") sendState = "sent";
    else if (eligibility.reason === "claimed") sendState = "claimed";
    else if (eligibility.reason === "uncertain") sendState = "uncertain";
  }

  return (
    <WorkspaceContent>
      <WorkspaceHeader title="WhatsApp AI draft" description="Decision context and history for one AI-generated WhatsApp reply." />
      <WhatsAppDraftApprovalDetail item={result.approval} events={result.events} canDecide={decideCheck.decision.allowed} sendState={sendState} sourceRefs={sourceRefs} />
    </WorkspaceContent>
  );
}
