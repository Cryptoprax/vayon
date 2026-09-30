import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/observability/logger";
import { TokenCryptoService } from "@/features/platform/integrations/google/services/token-crypto.service";
import { MetaGraphMarketingProvider, GraphHttpError, GraphTimeoutError, type MetaMarketingProvider } from "../providers/meta-graph.provider";
import { validateGraphLeadResponse, normalizeLeadFields, InvalidLeadResponseError } from "./normalize-lead";

export const defaultLeadDetailBatchLimit = 20;

export type MetaLeadFetchErrorCode =
  | "INVALID_LEAD_ID" | "TOKEN_INVALID" | "LEAD_NOT_FOUND" | "RATE_LIMITED"
  | "PROVIDER_ERROR" | "TIMEOUT" | "NETWORK_ERROR" | "MALFORMED_RESPONSE" | "RESPONSE_ID_MISMATCH";

export interface ClaimedStagingRow {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly propertyId: string;
  readonly campaignId: string | null;
  readonly leadgenId: string;
  readonly pageId: string;
  readonly formId: string;
  readonly adId: string | null;
  readonly adGroupId: string | null;
}
export interface LeadDetailOutcome {
  readonly stagingId: string;
  readonly leadgenId: string;
  readonly outcome: "fetched" | "fetch_failed" | "invalid_payload" | "unresolved_connection";
}

function toClaimedRow(row: Record<string, unknown>): ClaimedStagingRow {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    workspaceId: String(row.workspace_id),
    connectionId: String(row.connection_id),
    propertyId: String(row.property_id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    leadgenId: String(row.leadgen_id),
    pageId: String(row.page_id),
    formId: String(row.form_id),
    adId: row.ad_id ? String(row.ad_id) : null,
    adGroupId: row.ad_group_id ? String(row.ad_group_id) : null,
  };
}

/** Part 11/Part 25: the RPC's own INSERT ... ON CONFLICT + UPDATE ... WHERE claim is what guarantees one worker per event. */
export async function claimMetaLeadDetailBatch(client: SupabaseClient, limit = defaultLeadDetailBatchLimit): Promise<readonly ClaimedStagingRow[]> {
  const { data, error } = await client.rpc("claim_meta_lead_detail_batch", { p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toClaimedRow);
}

function classifyGraphError(error: unknown): MetaLeadFetchErrorCode {
  if (error instanceof GraphTimeoutError) return "TIMEOUT";
  if (error instanceof GraphHttpError) {
    if (error.status === 400) return "INVALID_LEAD_ID";
    if (error.status === 401 || error.status === 403) return "TOKEN_INVALID";
    if (error.status === 404) return "LEAD_NOT_FOUND";
    if (error.status === 429) return "RATE_LIMITED";
    return "PROVIDER_ERROR";
  }
  return "NETWORK_ERROR";
}

async function fail(client: SupabaseClient, row: ClaimedStagingRow, status: "fetch_failed" | "invalid_payload" | "unresolved_connection", code: string | null) {
  await client.rpc("fail_meta_lead_detail_fetch", { p_staging_id: row.id, p_status: status, p_error_code: code });
  if (status !== "unresolved_connection") {
    await Promise.resolve(client.from("activity_events").insert({
      organization_id: row.organizationId, workspace_id: row.workspaceId,
      event_type: "meta.lead_detail.failed", title: "Meta Lead Ads detail fetch failed",
      related_type: "property", related_id: row.propertyId, metadata: { errorCode: code },
    })).catch(() => undefined);
  }
  return { stagingId: row.id, leadgenId: row.leadgenId, outcome: status } as const;
}

/**
 * Processes exactly one already-claimed staging row: revalidate connection
 * (Part 2) -> decrypt token server-side only (Part 3) -> fetch -> validate
 * response (Part 5) -> normalize (Part 6/7) -> persist normalized result.
 * Never returns or logs the decrypted token, the raw Graph response, or any
 * normalized PII field (only identifiers/status/error codes are logged).
 */
export async function processClaimedLeadDetail(
  client: SupabaseClient,
  row: ClaimedStagingRow,
  provider: MetaMarketingProvider,
  crypto: TokenCryptoService,
): Promise<LeadDetailOutcome> {
  const { data: connection, error } = await client
    .from("meta_marketing_connections")
    .select("organization_id,workspace_id,page_id,status,deleted_at,access_token_ciphertext,access_token_iv,access_token_tag")
    .eq("id", row.connectionId)
    .maybeSingle();
  if (error) throw error;

  const c = connection as Record<string, unknown> | null;
  const revalidated = !!c
    && c.organization_id === row.organizationId
    && c.workspace_id === row.workspaceId
    && c.status === "connected"
    && c.deleted_at === null
    && c.page_id === row.pageId;
  if (!revalidated) return fail(client, row, "unresolved_connection", null);

  const pageToken = crypto.decrypt({ ciphertext: String(c!.access_token_ciphertext), iv: String(c!.access_token_iv), tag: String(c!.access_token_tag) });

  let response: unknown;
  try {
    response = await provider.getLead(row.leadgenId, pageToken);
  } catch (graphError) {
    const code = classifyGraphError(graphError);
    log("meta_leadgen.lead_detail_fetch_failed", { leadgenId: row.leadgenId, errorCode: code });
    if (code === "TOKEN_INVALID") await Promise.resolve(client.rpc("mark_meta_connection_token_invalid", { p_connection_id: row.connectionId })).catch(() => undefined);
    return fail(client, row, "fetch_failed", code);
  }

  let fields;
  try {
    fields = validateGraphLeadResponse(response, row.leadgenId);
  } catch (validationError) {
    const code = validationError instanceof InvalidLeadResponseError ? validationError.code : "MALFORMED_RESPONSE";
    log("meta_leadgen.lead_detail_invalid_payload", { leadgenId: row.leadgenId, errorCode: code });
    return fail(client, row, "invalid_payload", code);
  }

  const normalized = normalizeLeadFields(fields);
  const { error: completeError } = await client.rpc("complete_meta_lead_detail_fetch", {
    p_staging_id: row.id,
    p_full_name: normalized.fullName,
    p_first_name: normalized.firstName,
    p_last_name: normalized.lastName,
    p_email: normalized.email,
    p_phone_raw: normalized.phoneRaw,
    p_phone: normalized.phone,
    p_city: normalized.city,
    p_custom_answers: normalized.customAnswers,
  });
  if (completeError) throw completeError;

  await Promise.resolve(client.from("activity_events").insert({
    organization_id: row.organizationId, workspace_id: row.workspaceId,
    event_type: "meta.lead_detail.fetched", title: "Meta Lead Ads detail fetched",
    related_type: "property", related_id: row.propertyId,
  })).catch(() => undefined);

  log("meta_leadgen.lead_detail_fetched", { leadgenId: row.leadgenId });
  return { stagingId: row.id, leadgenId: row.leadgenId, outcome: "fetched" };
}

/**
 * Part 24/25: the batch entry point for the internal processor route. One
 * bad claimed row (an unexpected throw inside processClaimedLeadDetail)
 * never blocks the rest of the batch -- it is caught, the row is marked
 * fetch_failed defensively so it never stays stuck in 'fetching', and the
 * loop continues.
 */
export async function processPendingMetaLeadgenEvents(
  client: SupabaseClient,
  options: { provider?: MetaMarketingProvider; crypto?: TokenCryptoService; limit?: number } = {},
): Promise<{ claimed: number; results: readonly LeadDetailOutcome[] }> {
  const provider = options.provider ?? new MetaGraphMarketingProvider();
  const crypto = options.crypto ?? new TokenCryptoService();
  const batch = await claimMetaLeadDetailBatch(client, options.limit ?? defaultLeadDetailBatchLimit);

  const results: LeadDetailOutcome[] = [];
  for (const row of batch) {
    try {
      results.push(await processClaimedLeadDetail(client, row, provider, crypto));
    } catch (unexpected) {
      log("meta_leadgen.lead_detail_processing_error", { leadgenId: row.leadgenId, reason: unexpected instanceof Error ? unexpected.name : "unknown" });
      await Promise.resolve(client.rpc("fail_meta_lead_detail_fetch", { p_staging_id: row.id, p_status: "fetch_failed", p_error_code: "PROVIDER_ERROR" })).catch(() => undefined);
      results.push({ stagingId: row.id, leadgenId: row.leadgenId, outcome: "fetch_failed" });
    }
  }
  return { claimed: batch.length, results };
}
