import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Phase E6, Part 2: the documented threshold constant, not hardcoded SQL
 * magic. No existing WhatsApp-specific request-timeout convention was found
 * in this codebase (sendText()'s fetch() call has no explicit AbortSignal
 * timeout at all). 5 minutes is chosen because it safely exceeds any
 * plausible Vercel serverless function execution duration for the
 * claim -> sendText -> mark_whatsapp_send_succeeded sequence (which
 * completes in seconds under normal conditions) -- so a still-'claimed' row
 * this old has definitely already terminated one way or another without
 * confirming its outcome, not merely "still running."
 */
export const WHATSAPP_SEND_UNCERTAIN_AFTER_MS = 5 * 60 * 1000;

export interface FlagStaleWhatsAppSendExecutionsResult {
  readonly flaggedExecutionIds: readonly string[];
}

/**
 * State classification only. Never calls Meta, never sends, never retries,
 * never marks anything sent or failed -- it only reclassifies a stale
 * 'claimed' row as 'uncertain' (see the migration for why 'uncertain', not
 * 'failed'). Intended to be invoked from a scheduled/cron-triggered route
 * (app/api/whatsapp/send-executions/reconcile/route.ts) -- service-role,
 * no user session required, matching the existing founding-member
 * reconciliation route's pattern.
 */
export async function flagStaleWhatsAppSendExecutions(now: Date = new Date()): Promise<FlagStaleWhatsAppSendExecutionsResult> {
  const client = createSupabaseServiceClient();
  const staleBefore = new Date(now.getTime() - WHATSAPP_SEND_UNCERTAIN_AFTER_MS).toISOString();
  const { data, error } = await client.rpc("flag_stale_whatsapp_send_executions", { p_stale_before: staleBefore });
  if (error) throw error;
  return { flaggedExecutionIds: ((data ?? []) as readonly string[]).map(String) };
}

export interface UncertainWhatsAppSendExecution {
  readonly id: string;
  readonly draftMessageId: string;
  readonly claimedAt: string;
}

/**
 * Part 10: a reusable, tenant-scoped read for a future founder/ops surface
 * to wire up -- deliberately not wired into any dashboard in this phase
 * (the existing founder integrations page is a large, unrelated surface;
 * adding a widget there is more UI work than this phase's minimal-hardening
 * scope justifies). Kept here so that later work does not need to
 * re-investigate this query.
 */
export async function listUncertainWhatsAppSendExecutions(organizationId: string, workspaceId: string): Promise<readonly UncertainWhatsAppSendExecution[]> {
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("whatsapp_ai_send_executions")
    .select("id,draft_message_id,claimed_at")
    .eq("organization_id", organizationId)
    .eq("workspace_id", workspaceId)
    .eq("status", "uncertain")
    .order("claimed_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { id: string; draft_message_id: string; claimed_at: string }[]).map((row) => ({ id: row.id, draftMessageId: row.draft_message_id, claimedAt: row.claimed_at }));
}
