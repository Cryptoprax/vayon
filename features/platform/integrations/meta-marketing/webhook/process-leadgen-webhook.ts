import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/observability/logger";
import { resolveMetaLeadTenant } from "../services/resolve-meta-lead-tenant";
import { extractLeadgenChanges, type RawLeadgenChange } from "./leadgen-event";

export interface LeadgenChangeResult {
  readonly leadgenId: string;
  readonly outcome: "processed" | "unresolved" | "duplicate" | "failed";
}

/**
 * Order (Part 9): the webhook route verifies the signature and parses JSON
 * BEFORE this function is ever called. From here: normalize -> derive the
 * deterministic event id (leadgenId, already the property name) -> resolve
 * tenant -> atomically claim/record the event. A duplicate delivery is
 * claimed by nobody a second time (process_meta_leadgen_event's own ON
 * CONFLICT DO NOTHING), so it can never reach a future M4 lead-detail fetch
 * twice. Tenant is resolved ONLY via resolveMetaLeadTenant(pageId, formId)
 * (M1/M2's own resolver, not reimplemented here) -- nothing in the webhook
 * payload is ever treated as an organization/workspace id.
 *
 * Each change is processed independently (Part 21): one failure never stops
 * the rest of a batched payload from being recorded, and only a THROWN
 * (unexpected/persistence) failure marks the overall result not-ok, so Meta
 * retries the whole envelope -- already-recorded changes then simply
 * re-dedupe as "duplicate" on that retry.
 */
export async function processMetaLeadgenWebhookPayload(client: SupabaseClient, payload: unknown): Promise<{ ok: boolean; results: readonly LeadgenChangeResult[] }> {
  const changes = extractLeadgenChanges(payload);
  const results: LeadgenChangeResult[] = [];
  let ok = true;

  for (const change of changes) {
    try {
      results.push(await processOneChange(client, change));
    } catch (error) {
      log("meta_leadgen.webhook_event_failed", { leadgenId: change.leadgenId, reason: error instanceof Error ? error.name : "unknown" });
      results.push({ leadgenId: change.leadgenId, outcome: "failed" });
      ok = false;
    }
  }
  return { ok, results };
}

async function processOneChange(client: SupabaseClient, change: RawLeadgenChange): Promise<LeadgenChangeResult> {
  const resolution = await resolveMetaLeadTenant(client, change.pageId, change.formId);

  const { data, error } = await client.rpc("process_meta_leadgen_event", {
    p_event_id: change.leadgenId,
    p_page_id: change.pageId,
    p_form_id: change.formId,
    p_ad_id: change.adId,
    p_ad_group_id: change.adGroupId,
    p_created_time: change.createdTime,
    p_organization_id: resolution?.organizationId ?? null,
    p_workspace_id: resolution?.workspaceId ?? null,
    p_connection_id: resolution?.connectionId ?? null,
    p_property_id: resolution?.propertyId ?? null,
    p_campaign_id: resolution?.campaignId ?? null,
  });
  if (error) throw error;

  const outcome = data === "duplicate" ? "duplicate" : data === "unresolved" ? "unresolved" : "processed";
  return { leadgenId: change.leadgenId, outcome };
}
