import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/observability/logger";

export const defaultCrmIngestionBatchLimit = 20;

export type MetaCrmIngestionOutcome = "completed" | "identity_conflict" | "failed" | "skipped";
export type MetaCrmIngestionErrorCode =
  | "PROPERTY_NOT_FOUND" | "IDENTITY_CONFLICT" | "AMBIGUOUS_PHONE" | "AMBIGUOUS_EMAIL"
  | "CRM_WRITE_FAILED" | "PROPERTY_INTEREST_FAILED" | "INVALID_STAGING_STATE";

export interface MetaCrmIngestionResult {
  readonly stagingId: string;
  readonly outcome: MetaCrmIngestionOutcome;
  readonly errorCode: MetaCrmIngestionErrorCode | null;
  readonly leadId: string | null;
  readonly propertyInterestCreated: boolean;
  readonly organizationId: string | null;
  readonly workspaceId: string | null;
}

/** Part 29: a read-only listing -- true concurrency safety comes from ingest_meta_lead_to_crm's own atomic claim, not from this list. */
export async function listPendingCrmIngestionBatch(client: SupabaseClient, limit = defaultCrmIngestionBatchLimit): Promise<readonly string[]> {
  const { data, error } = await client.rpc("list_meta_lead_crm_pending_batch", { p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as unknown[]).map(String);
}

/**
 * Calls the single atomic per-row RPC (Part 16) and records a best-effort,
 * PII-free activity_events entry based on the outcome. Never logs or records
 * name/email/phone/custom answers -- only stagingId/leadId/errorCode.
 * 'skipped' (claim missed -- already processed or not yet fetched) never
 * produces an activity_events row, so a concurrent-worker race or a replayed
 * batch cannot create duplicate events (Part 28).
 */
export async function ingestMetaLeadToCrm(client: SupabaseClient, stagingId: string): Promise<MetaCrmIngestionResult> {
  const { data, error } = await client.rpc("ingest_meta_lead_to_crm", { p_staging_id: stagingId });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const result: MetaCrmIngestionResult = {
    stagingId,
    outcome: (row?.outcome as MetaCrmIngestionOutcome) ?? "failed",
    errorCode: (row?.error_code as MetaCrmIngestionErrorCode | null) ?? null,
    leadId: row?.lead_id ? String(row.lead_id) : null,
    propertyInterestCreated: Boolean(row?.property_interest_created),
    organizationId: row?.organization_id ? String(row.organization_id) : null,
    workspaceId: row?.workspace_id ? String(row.workspace_id) : null,
  };

  if (result.outcome === "skipped" || !result.organizationId || !result.workspaceId) return result;

  const eventType =
    result.outcome === "completed" ? (result.propertyInterestCreated ? "meta.lead.crm_created" : "meta.lead.crm_matched")
    : result.outcome === "identity_conflict" ? "meta.lead.identity_conflict"
    : "meta.lead.crm_ingestion_failed";

  await Promise.resolve(client.from("activity_events").insert({
    organization_id: result.organizationId, workspace_id: result.workspaceId,
    event_type: eventType, title: "Meta Lead Ads CRM ingestion " + result.outcome,
    related_type: result.leadId ? "lead" : null, related_id: result.leadId,
    metadata: { stagingId: result.stagingId, errorCode: result.errorCode },
  })).catch(() => undefined);

  log("meta_leadgen.crm_ingestion_" + result.outcome, { stagingId: result.stagingId, errorCode: result.errorCode });
  return result;
}

/**
 * Part 29: the batch entry point for the internal processor route. One bad
 * claimed row (an unexpected throw calling the RPC itself) never blocks the
 * rest of the batch.
 */
export async function processPendingMetaLeadCrmIngestion(
  client: SupabaseClient,
  options: { limit?: number } = {},
): Promise<{ claimed: number; results: readonly MetaCrmIngestionResult[] }> {
  const ids = await listPendingCrmIngestionBatch(client, options.limit ?? defaultCrmIngestionBatchLimit);

  const results: MetaCrmIngestionResult[] = [];
  for (const stagingId of ids) {
    try {
      results.push(await ingestMetaLeadToCrm(client, stagingId));
    } catch (unexpected) {
      log("meta_leadgen.crm_ingestion_processing_error", { stagingId, reason: unexpected instanceof Error ? unexpected.name : "unknown" });
      results.push({ stagingId, outcome: "failed", errorCode: "CRM_WRITE_FAILED", leadId: null, propertyInterestCreated: false, organizationId: null, workspaceId: null });
    }
  }
  return { claimed: ids.length, results };
}
