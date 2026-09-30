import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export interface WhatsAppDraftSendEligibilityInput {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly draftMessageId: string;
}

export type WhatsAppDraftIneligibleReason = "not_found" | "channel_mismatch" | "not_approved" | "already_sent" | "claimed" | "uncertain";

export type WhatsAppDraftSendEligibility =
  | { readonly eligible: true; readonly approvalId: string; readonly communicationThreadId: string; readonly leadId: string | null; readonly retryOfFailedExecution: boolean }
  | { readonly eligible: false; readonly reason: WhatsAppDraftIneligibleReason; readonly approvalId: string | null };

/**
 * Server-side-only answer to "is this draft approved and eligible to send?"
 * for a later, explicit send phase (E5) to call before ever invoking the
 * Graph API. Never trusts a client-supplied approvalId alone -- it always
 * re-derives the approval from the draft's own tenant-scoped identity
 * (organization_id/workspace_id/draftMessageId), and re-checks every
 * condition itself rather than accepting a boolean flag from the caller.
 * This function performs no write and calls no provider; it only reads.
 */
export async function resolveWhatsAppDraftSendEligibility(input: WhatsAppDraftSendEligibilityInput): Promise<WhatsAppDraftSendEligibility> {
  const client = createSupabaseServiceClient();

  const { data: draft, error: draftError } = await client
    .from("ai_workforce_messages")
    .select("id,conversation_id,role,delivery_state")
    .eq("id", input.draftMessageId)
    .eq("organization_id", input.organizationId)
    .eq("workspace_id", input.workspaceId)
    .eq("role", "assistant")
    .maybeSingle();
  if (draftError) throw draftError;
  if (!draft) return { eligible: false, reason: "not_found", approvalId: null };

  const { data: conversation, error: conversationError } = await client
    .from("ai_workforce_conversations")
    .select("id,channel,communication_thread_id,lead_id")
    .eq("id", draft.conversation_id)
    .eq("organization_id", input.organizationId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation || conversation.channel !== "whatsapp" || !conversation.communication_thread_id) {
    return { eligible: false, reason: "channel_mismatch", approvalId: null };
  }

  const { data: approval, error: approvalError } = await client
    .from("approval_requests")
    .select("id,status")
    .eq("organization_id", input.organizationId)
    .eq("workspace_id", input.workspaceId)
    .eq("source_type", "whatsapp_ai_draft")
    .eq("source_id", input.draftMessageId)
    .eq("action_type", "whatsapp.message.send")
    .maybeSingle();
  if (approvalError) throw approvalError;
  if (!approval || approval.status !== "approved") return { eligible: false, reason: "not_approved", approvalId: approval?.id ?? null };

  // Phase E6: an execution row's status is the most current, authoritative
  // signal -- checked before the delivery_state fallback below. 'claimed'
  // (a send is currently in flight, or not yet reconciled as stale) and
  // 'uncertain' (Meta's outcome could not be confirmed -- see the Phase E6
  // report) both fail closed here, with no override. A 'failed' execution
  // deliberately falls through to eligible:true below (Part 7: retry allowed).
  const { data: execution, error: executionError } = await client
    .from("whatsapp_ai_send_executions")
    .select("status")
    .eq("organization_id", input.organizationId)
    .eq("workspace_id", input.workspaceId)
    .eq("draft_message_id", input.draftMessageId)
    .maybeSingle();
  if (executionError) throw executionError;
  if (execution?.status === "claimed") return { eligible: false, reason: "claimed", approvalId: approval.id };
  if (execution?.status === "uncertain") return { eligible: false, reason: "uncertain", approvalId: approval.id };

  // delivery_state can only be 'not_applicable', 'draft', or 'sent' -- no
  // other value is ever set here (Part 8: do not fake delivery state).
  if (draft.delivery_state !== "draft") return { eligible: false, reason: "already_sent", approvalId: approval.id };

  return { eligible: true, approvalId: approval.id, communicationThreadId: conversation.communication_thread_id, leadId: conversation.lead_id ?? null, retryOfFailedExecution: execution?.status === "failed" };
}
