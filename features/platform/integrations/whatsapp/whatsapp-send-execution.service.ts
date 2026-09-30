import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { WhatsAppService } from "./whatsapp.service";
import { resolveWhatsAppDraftSendEligibility } from "./whatsapp-draft-send-eligibility.service";

/**
 * Phase E5's only entry point that can trigger a real WhatsApp send.
 *
 * Deliberately takes ONLY draftMessageId, not {organizationId, workspaceId,
 * draftMessageId} as the Phase E5 spec's conceptual signature suggested --
 * organizationId/workspaceId are derived internally via operationsContext(),
 * the same authenticated-session-bound source GovernanceService.production()
 * and WhatsAppService.sendText() already use, so there is no parameter for a
 * browser to override at all (a strictly stronger guarantee than accepting
 * and re-validating a passed-in value). This function must only ever be
 * invoked from an interactive, authenticated caller (a Next.js Server
 * Action) -- never from the WhatsApp webhook path, which has no session.
 *
 * Never accepts message text, recipient phone, phone_number_id, an access
 * token, an approval status, or an organization override from its caller --
 * every one of those is re-derived from trusted persisted records inside
 * this function or the RPCs it calls.
 */
export type ExecuteApprovedWhatsAppDraftResult =
  | { readonly outcome: "sent"; readonly executionId: string; readonly providerMessageId: string }
  | { readonly outcome: "not_eligible"; readonly reason: string }
  | { readonly outcome: "already_claimed_or_sent" }
  | { readonly outcome: "send_failed"; readonly executionId: string; readonly failureCode: string };

function classifyFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status = /status (\d+)/.exec(message)?.[1];
  if (status === "401" || status === "403") return "authentication_failed";
  if (status === "429") return "rate_limited";
  if (status && Number(status) >= 500) return "provider_unavailable";
  if (status === "400") return "bad_request";
  if (/not connected/i.test(message)) return "connection_unavailable";
  if (/timeout|aborted/i.test(message)) return "timeout";
  if (/network|fetch failed/i.test(message)) return "network_error";
  return "unknown_error";
}

export async function executeApprovedWhatsAppDraft(draftMessageId: string): Promise<ExecuteApprovedWhatsAppDraftResult> {
  const context = await operationsContext();

  // PART 3: re-check eligibility server-side, immediately before sending --
  // never trust that an earlier UI screen's approval check is still true.
  // This is a fast, user-friendly fail-closed check; claim_whatsapp_draft_send
  // below is the actual atomic security boundary (it re-verifies the same
  // conditions itself, inside one transaction, so this check and the claim
  // cannot race each other into an inconsistent decision).
  const eligibility = await resolveWhatsAppDraftSendEligibility({ organizationId: context.organizationId, workspaceId: context.workspaceId, draftMessageId });
  if (!eligibility.eligible) return { outcome: "not_eligible", reason: eligibility.reason };

  let executionId: string;
  try {
    const { data, error } = await context.client.rpc("claim_whatsapp_draft_send", { p_workspace_id: context.workspaceId, p_draft_message_id: draftMessageId });
    if (error) throw error;
    executionId = String(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ALREADY_CLAIMED_OR_SENT") || message.includes("NOT_ELIGIBLE")) return { outcome: "already_claimed_or_sent" };
    throw error;
  }

  // PART 4/5: the exact persisted draft text and the thread's own canonical
  // normalized recipient phone -- never anything reconstructed, regenerated,
  // or supplied by the caller.
  const { data: draft, error: draftError } = await context.client
    .from("ai_workforce_messages")
    .select("content,conversation_id")
    .eq("id", draftMessageId)
    .eq("organization_id", context.organizationId)
    .eq("workspace_id", context.workspaceId)
    .single();
  if (draftError) throw draftError;

  const { data: conversation, error: conversationError } = await context.client
    .from("ai_workforce_conversations")
    .select("communication_thread_id")
    .eq("id", draft.conversation_id)
    .eq("organization_id", context.organizationId)
    .eq("workspace_id", context.workspaceId)
    .single();
  if (conversationError) throw conversationError;

  const { data: thread, error: threadError } = await context.client
    .from("communication_threads")
    .select("metadata")
    .eq("id", conversation.communication_thread_id)
    .eq("organization_id", context.organizationId)
    .eq("workspace_id", context.workspaceId)
    .single();
  if (threadError) throw threadError;

  const recipient = String((thread.metadata as Record<string, unknown> | null)?.whatsapp_phone ?? "");
  if (!recipient) {
    await context.client.rpc("mark_whatsapp_send_failed", { p_workspace_id: context.workspaceId, p_execution_id: executionId, p_failure_code: "missing_recipient" });
    return { outcome: "send_failed", executionId, failureCode: "missing_recipient" };
  }

  let providerResponse: unknown;
  try {
    providerResponse = await new WhatsAppService().sendText(recipient, draft.content);
  } catch (error) {
    const failureCode = classifyFailure(error);
    await context.client.rpc("mark_whatsapp_send_failed", { p_workspace_id: context.workspaceId, p_execution_id: executionId, p_failure_code: failureCode });
    return { outcome: "send_failed", executionId, failureCode };
  }

  const providerMessageId = String((providerResponse as { messages?: readonly { id?: string }[] } | undefined)?.messages?.[0]?.id ?? "");
  if (!providerMessageId) {
    await context.client.rpc("mark_whatsapp_send_failed", { p_workspace_id: context.workspaceId, p_execution_id: executionId, p_failure_code: "missing_provider_message_id" });
    return { outcome: "send_failed", executionId, failureCode: "missing_provider_message_id" };
  }

  const { error: succeededError } = await context.client.rpc("mark_whatsapp_send_succeeded", {
    p_workspace_id: context.workspaceId,
    p_execution_id: executionId,
    p_provider_message_id: providerMessageId,
    p_recipient: recipient,
    p_message_text: draft.content,
  });
  if (succeededError) throw succeededError;

  return { outcome: "sent", executionId, providerMessageId };
}
