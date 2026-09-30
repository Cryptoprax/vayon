"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { requireEntitlement } from "@/features/vayon/billing/services/require-entitlement";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { executeGovernedMetaLeadWhatsAppOutreach } from "./whatsapp-outreach-execution.service";
import type { TemplateVariablesByComponent } from "./whatsapp-outreach-template";

/**
 * Phase M7: the ONLY way to trigger a real first-contact WhatsApp send from
 * the UI. Reuses requireWorkspacePermission("approvals", "approve") --
 * identical choice and reasoning to Phase E5's sendApprovedWhatsAppDraftAction:
 * no dedicated "communications"/"whatsapp" permission module exists in the
 * central catalog (features/platform/permissions/runtime/types.ts), and
 * sending a real customer message is at least as sensitive as deciding an
 * approval. A first-touch template send has no approval_requests row to
 * hang off of, but the privilege bar for "who may commit VAYON to an
 * outbound customer message" should be the same either way -- this is a
 * deliberate, documented reuse, not a new role system.
 */
function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`);
}

function collectVariables(formData: FormData, prefix: "header" | "body"): readonly string[] {
  const values: string[] = [];
  for (let index = 1; formData.has(`${prefix}-${index}`); index += 1) {
    values.push(String(formData.get(`${prefix}-${index}`) ?? ""));
  }
  return values;
}

export async function sendWhatsAppOutreachAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "");
  const executionId = String(formData.get("executionId") ?? "");
  const templateName = String(formData.get("templateName") ?? "");
  const templateLanguage = String(formData.get("templateLanguage") ?? "");
  const redirectPath = `/vayon/crm/leads/${leadId}/whatsapp-outreach`;

  if (!leadId || !executionId || !templateName || !templateLanguage) {
    fail(redirectPath, "A lead, outreach attempt, and template are all required.");
  }

  await guardSubscriptionAction();
  await requireEntitlement("whatsapp");
  await requireWorkspacePermission("approvals", "approve");

  const variablesByComponent: TemplateVariablesByComponent = {
    HEADER: collectVariables(formData, "header"),
    BODY: collectVariables(formData, "body"),
  };

  try {
    const result = await executeGovernedMetaLeadWhatsAppOutreach({ leadId, executionId, templateName, templateLanguage, variablesByComponent });
    if (result.outcome === "not_eligible") fail(redirectPath, `This lead is not eligible for WhatsApp outreach right now (${result.reason}).`);
    if (result.outcome === "already_claimed_or_sent") fail(redirectPath, "This outreach attempt is already in progress or has already been sent.");
    if (result.outcome === "invalid_template") fail(redirectPath, "The selected template is no longer available. Please choose again.");
    if (result.outcome === "invalid_variables") fail(redirectPath, "The template variables are invalid. Please check and try again.");
    if (result.outcome === "send_failed") fail(redirectPath, "WhatsApp delivery failed. You may try again.");
  } catch (error) {
    fail(redirectPath, error);
  }

  revalidatePath(`/vayon/crm/leads/${leadId}`);
  revalidatePath(redirectPath);
  redirect(`${redirectPath}?success=${encodeURIComponent("WhatsApp message sent.")}`);
}
