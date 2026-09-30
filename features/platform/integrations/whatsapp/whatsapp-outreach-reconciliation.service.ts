import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Phase M7, mirroring Phase E6's WHATSAPP_SEND_UNCERTAIN_AFTER_MS exactly:
 * a documented threshold constant, not hardcoded SQL magic. Same 5-minute
 * value for the same reason -- it safely exceeds any plausible serverless
 * execution duration for the claim -> sendTemplate -> mark_whatsapp_outreach_
 * sent sequence, which completes in seconds under normal conditions.
 */
export const WHATSAPP_OUTREACH_UNCERTAIN_AFTER_MS = 5 * 60 * 1000;

export interface FlagStaleWhatsAppOutreachExecutionsResult {
  readonly flaggedExecutionIds: readonly string[];
}

/**
 * State classification only. Never calls Meta, never sends, never retries,
 * never marks anything sent or failed -- it only reclassifies a stale
 * 'claimed' row as 'uncertain'. Intended for the same scheduled/
 * cron-triggered route pattern as the existing E6/M4/M5/M6 reconcile
 * routes -- service-role, no user session required.
 */
export async function flagStaleWhatsAppOutreachExecutions(now: Date = new Date()): Promise<FlagStaleWhatsAppOutreachExecutionsResult> {
  const client = createSupabaseServiceClient();
  const staleBefore = new Date(now.getTime() - WHATSAPP_OUTREACH_UNCERTAIN_AFTER_MS).toISOString();
  const { data, error } = await client.rpc("flag_stale_whatsapp_outreach_executions", { p_stale_before: staleBefore });
  if (error) throw error;
  return { flaggedExecutionIds: ((data ?? []) as readonly string[]).map(String) };
}

export interface UncertainWhatsAppOutreachExecution {
  readonly id: string;
  readonly leadId: string;
  readonly claimedAt: string;
}

/** Part 24: a reusable, tenant-scoped read for a future review surface -- deliberately not wired into a dashboard in this phase, mirroring E6's own disclosed deferral of listUncertainWhatsAppSendExecutions. */
export async function listUncertainWhatsAppOutreachExecutions(organizationId: string, workspaceId: string): Promise<readonly UncertainWhatsAppOutreachExecution[]> {
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("whatsapp_outreach_executions")
    .select("id,lead_id,claimed_at")
    .eq("organization_id", organizationId)
    .eq("workspace_id", workspaceId)
    .eq("status", "uncertain")
    .order("claimed_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { id: string; lead_id: string; claimed_at: string }[]).map((row) => ({ id: row.id, leadId: row.lead_id, claimedAt: row.claimed_at }));
}
