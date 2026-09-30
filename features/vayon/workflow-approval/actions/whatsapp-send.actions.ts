"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { GovernanceService } from "../services/governance.service";
import { executeApprovedWhatsAppDraft } from "@/features/platform/integrations/whatsapp/whatsapp-send-execution.service";

/**
 * Phase E5: the ONLY way to trigger a real WhatsApp send from the UI --
 * explicit, separate from approveWhatsAppDraftAction (Phase E4). Approving a
 * draft never sends it; a reviewer must additionally click "Send Approved
 * Reply" (Part 12: safer, easier to reason about for launch).
 *
 * Reuses requireWorkspacePermission("approvals", "approve") rather than
 * introducing a new "communications" permission module -- see the Phase E5
 * report's SEND PERMISSION section for why: sending a real customer message
 * is at least as sensitive as deciding the underlying approval, so this
 * phase deliberately does not grant it to any wider audience than can
 * already decide that same approval. A dedicated communications permission
 * module remains a reasonable future refinement, not something this phase
 * needed to invent.
 *
 * Gated by requireEntitlement("whatsapp") (Professional+), never the
 * commercial Approval Workflows entitlement (Business+) -- identical
 * reasoning to Phase E4's whatsapp-approval.actions.ts.
 */
function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
}

export async function sendApprovedWhatsAppDraftAction(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const redirectPath = `/vayon/whatsapp/approvals/${approvalId}`;

  await guardSubscriptionAction();
  await requireEntitlement("whatsapp");
  await requireWorkspacePermission("approvals", "approve");

  const service = await GovernanceService.production();
  const { approval } = await service.approval(approvalId);
  if (!approval || approval.sourceType !== "whatsapp_ai_draft" || approval.actionType !== "whatsapp.message.send") {
    fail(redirectPath, "This approval is not a WhatsApp AI draft.");
  }
  if (approval.status !== "approved") {
    fail(redirectPath, "Only an approved draft can be sent.");
  }
  if (!approval.sourceId) {
    fail(redirectPath, "This approval has no associated draft.");
  }

  try {
    const result = await executeApprovedWhatsAppDraft(approval.sourceId);
    if (result.outcome === "not_eligible") fail(redirectPath, `This draft is not eligible to send (${result.reason}).`);
    if (result.outcome === "already_claimed_or_sent") fail(redirectPath, "This draft is already being sent or has already been sent.");
    if (result.outcome === "send_failed") fail(redirectPath, "WhatsApp delivery failed. You may try again.");
  } catch (error) {
    fail(redirectPath, error);
  }

  revalidatePath("/vayon/whatsapp/approvals");
  revalidatePath(redirectPath);
}
