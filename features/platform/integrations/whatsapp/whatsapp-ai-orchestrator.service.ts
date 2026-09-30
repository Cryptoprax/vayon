import "server-only";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { buildTrustedWorkforceContext } from "@/features/platform/openai/runtime/trusted-context";
import { requestWhatsAppDraftApproval } from "./whatsapp-draft-approval.service";

/**
 * The only entry point from the WhatsApp webhook layer into the AI runtime
 * (Phase E3) and, since Phase E4, into the D1 approval engine. Reuses
 * WorkforceRuntimeService.forTrustedContext() (Phase E2) -- there is no
 * separate WhatsApp AI/LLM service here, only orchestration.
 *
 * Every field below must already have been derived from a trusted source
 * before this is called -- organizationId/workspaceId from
 * WhatsAppRepository.connectionByPhoneNumber() (phone_number_id lookup),
 * leadId/communicationThreadId from process_whatsapp_message()'s (Phase E1)
 * return value. This function never reads a request body itself and has no
 * parameter through which a raw Meta payload could be substituted for those
 * trusted values.
 *
 * Generates a DRAFT and requests human approval for it -- nothing more.
 * There is no code path here, in TrustedWorkforceRuntime.generateDraft(), in
 * generateWorkforceReply(), or in requestWhatsAppDraftApproval() that calls
 * the WhatsApp Graph API, sends a message, or mutates CRM beyond the lead
 * linkage Phase E1 already performed. Approval is requested for BOTH a
 * freshly generated draft and an idempotent replay ("already_generated"),
 * since request_whatsapp_draft_approval() is itself idempotent per draft --
 * so a webhook/orchestration retry can never create a duplicate approval
 * (Part 3/4/14: if approval creation fails, the already-persisted draft is
 * never deleted, and a retry safely reuses or creates the one approval).
 */
export interface InboundWhatsAppAIInput {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly leadId: string | null;
  readonly communicationThreadId: string;
  readonly text: string;
  readonly providerMessageId: string;
}

export type InboundWhatsAppAIOutcome =
  | { readonly processed: false; readonly reason: "empty_message" | "rate_limited" }
  | { readonly processed: true; readonly conversationId: string; readonly draftMessageId: string; readonly approvalId: string };

/** Phase E3's launch-safe employee choice for inbound WhatsApp text -- see the Phase E3 report's WHATSAPP EMPLOYEE section for why. */
export const WHATSAPP_INBOUND_AI_EMPLOYEE = "whatsapp-ai" as const;

export async function processInboundWhatsAppMessageForAI(input: InboundWhatsAppAIInput): Promise<InboundWhatsAppAIOutcome> {
  if (!input.text.trim()) return { processed: false, reason: "empty_message" };

  const context = buildTrustedWorkforceContext({
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    employeeCode: WHATSAPP_INBOUND_AI_EMPLOYEE,
    channel: "whatsapp",
    communicationThreadId: input.communicationThreadId,
    leadId: input.leadId,
  });

  const runtime = WorkforceRuntimeService.forTrustedContext(context);
  const result = await runtime.generateDraft({ message: input.text, sourceMessageId: input.providerMessageId });

  if (result.outcome === "rate_limited") return { processed: false, reason: "rate_limited" };

  const approvalId = await requestWhatsAppDraftApproval({
    workspaceId: input.workspaceId,
    draftMessageId: result.messageId,
    conversationId: result.conversationId,
    communicationThreadId: input.communicationThreadId,
    leadId: input.leadId,
    previewText: result.output,
  });

  return { processed: true, conversationId: result.conversationId, draftMessageId: result.messageId, approvalId };
}
