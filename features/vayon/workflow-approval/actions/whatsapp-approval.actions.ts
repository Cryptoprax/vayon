"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { GovernanceService } from "../services/governance.service";

/**
 * Phase E4: decide a WhatsApp AI draft's approval. Deliberately gated by
 * the WhatsApp entitlement (Professional+), NOT the commercial Approval
 * Workflows entitlement (Business+) -- see the Phase E4 report's COMMERCIAL APPROVALS VS SAFETY
 * APPROVALS section. This is a separate action file from
 * ../actions/approval.actions.ts specifically so the two entitlement checks
 * can never be confused or merged.
 *
 * Reuses GovernanceService.production()/decide_approval() completely
 * unmodified -- the only new logic here is (1) the different entitlement
 * gate and (2) the sourceType/actionType guard below, which stops this
 * WhatsApp-scoped action from ever being usable to decide an unrelated
 * (Business+-created) approval even if a caller supplied a valid approval id
 * for one.
 */
function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
}

async function decideWhatsAppDraft(id: string, expectedVersion: number, decision: "approved" | "rejected", reason: string | undefined, redirectPath: string) {
  await guardSubscriptionAction();
  await requireEntitlement("whatsapp");
  await requireWorkspacePermission("approvals", "approve");
  const service = await GovernanceService.production();
  const { approval } = await service.approval(id);
  if (!approval || approval.sourceType !== "whatsapp_ai_draft" || approval.actionType !== "whatsapp.message.send") {
    fail(redirectPath, "This approval is not a WhatsApp AI draft.");
  }
  try {
    await service.decideApproval(id, expectedVersion, decision, reason);
  } catch (error) {
    fail(redirectPath, error);
  }
  revalidatePath("/vayon/whatsapp/approvals");
  revalidatePath(`/vayon/whatsapp/approvals/${id}`);
}

export async function approveWhatsAppDraftAction(formData: FormData) {
  const id = String(formData.get("approvalId") ?? ""),
    version = Number(formData.get("version") ?? 0);
  await decideWhatsAppDraft(id, version, "approved", undefined, `/vayon/whatsapp/approvals/${id}`);
}

export async function rejectWhatsAppDraftAction(formData: FormData) {
  const id = String(formData.get("approvalId") ?? ""),
    version = Number(formData.get("version") ?? 0),
    reason = String(formData.get("reason") ?? "") || undefined;
  await decideWhatsAppDraft(id, version, "rejected", reason, `/vayon/whatsapp/approvals/${id}`);
}
