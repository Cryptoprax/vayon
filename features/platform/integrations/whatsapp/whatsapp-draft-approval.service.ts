import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export interface RequestWhatsAppDraftApprovalInput {
  readonly workspaceId: string;
  readonly draftMessageId: string;
  readonly conversationId: string;
  readonly communicationThreadId: string;
  readonly leadId: string | null;
  readonly previewText: string;
}

/**
 * Trusted, webhook-safe request for human approval of one WhatsApp AI draft.
 * Reuses Phase D1's approval_requests/approval_events tables via the new
 * service-role-only request_whatsapp_draft_approval() RPC (Phase E4,
 * 20261107000000_whatsapp_ai_draft_approval.sql) -- never request_approval()
 * itself, which requires an authenticated browser session this webhook path
 * does not have. Idempotent: calling this twice for the same draftMessageId
 * returns the same approval id, never a duplicate.
 */
export async function requestWhatsAppDraftApproval(input: RequestWhatsAppDraftApprovalInput): Promise<string> {
  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("request_whatsapp_draft_approval", {
    p_workspace_id: input.workspaceId,
    p_draft_message_id: input.draftMessageId,
    p_conversation_id: input.conversationId,
    p_communication_thread_id: input.communicationThreadId,
    p_lead_id: input.leadId,
    p_preview_text: input.previewText,
  });
  if (error) throw error;
  return String(data);
}
