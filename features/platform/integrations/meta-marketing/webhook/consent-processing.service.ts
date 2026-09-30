import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/observability/logger";
import { evaluateMetaLeadConsent, type ConsentCustomAnswer, type MetaConsentRule } from "../consent/evaluate-consent";

export const defaultConsentBatchLimit = 20;
export type MetaConsentOutcome = "no_rule" | "unverifiable" | "granted" | "not_granted" | "skipped";

export interface MetaConsentProcessingResult {
  readonly stagingId: string;
  readonly outcome: MetaConsentOutcome;
  readonly consentId: string | null;
  readonly leadId: string | null;
  readonly organizationId: string | null;
  readonly workspaceId: string | null;
}

interface ClaimedConsentStagingRow {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly leadId: string | null;
  readonly pageId: string;
  readonly formId: string;
  readonly customAnswers: readonly ConsentCustomAnswer[];
}

function toClaimedRow(row: Record<string, unknown>): ClaimedConsentStagingRow {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    workspaceId: String(row.workspace_id),
    leadId: row.crm_lead_id ? String(row.crm_lead_id) : null,
    pageId: String(row.page_id),
    formId: String(row.form_id),
    customAnswers: Array.isArray(row.custom_answers) ? (row.custom_answers as ConsentCustomAnswer[]) : [],
  };
}

/** Part 29: a read-only claim -- concurrency safety comes from the RPC's own atomic pending->processing compare-and-swap. */
export async function claimMetaLeadConsentBatch(client: SupabaseClient, limit = defaultConsentBatchLimit): Promise<readonly ClaimedConsentStagingRow[]> {
  const { data, error } = await client.rpc("claim_meta_lead_consent_batch", { p_limit: limit });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toClaimedRow);
}

/**
 * Part 5/26: finds the currently ACTIVE rule for the staging row's own Meta
 * form, tenant-scoped. Returns null when no rule is configured -- there is
 * no automatic inference from field names/words here, only an explicit
 * admin-authored mapping. Evaluating "whatever rule is active right now"
 * (never a historical one) is exactly what makes M6 never retroactively
 * reinterpret a staging row once it has already been processed (Part 26).
 */
async function findActiveRule(client: SupabaseClient, row: ClaimedConsentStagingRow): Promise<MetaConsentRule | null> {
  const mapping = await client
    .from("meta_lead_form_mappings")
    .select("id")
    .eq("organization_id", row.organizationId)
    .eq("workspace_id", row.workspaceId)
    .eq("page_id", row.pageId)
    .eq("form_id", row.formId)
    .eq("status", "active")
    .maybeSingle();
  if (mapping.error) throw mapping.error;
  if (!mapping.data) return null;

  const rule = await client
    .from("meta_lead_form_consent_rules")
    .select("id,consent_field_name,accepted_values,consent_statement,version")
    .eq("form_mapping_id", (mapping.data as Record<string, unknown>).id)
    .eq("active", true)
    .maybeSingle();
  if (rule.error) throw rule.error;
  if (!rule.data) return null;

  const r = rule.data as Record<string, unknown>;
  return {
    id: String(r.id),
    consentFieldName: String(r.consent_field_name),
    acceptedValues: Array.isArray(r.accepted_values) ? (r.accepted_values as string[]) : [],
    consentStatement: String(r.consent_statement),
    version: Number(r.version),
  };
}

/**
 * Processes exactly one already-claimed staging row: look up the active
 * rule (Part 5) -> evaluate deterministically (Part 8, pure function, no I/O)
 * -> persist atomically via complete_meta_lead_consent_processing. Never
 * logs or records name/email/phone/custom-answer values -- only
 * stagingId/leadId/consentId/outcome.
 */
export async function processClaimedMetaLeadConsent(client: SupabaseClient, row: ClaimedConsentStagingRow): Promise<MetaConsentProcessingResult> {
  const rule = await findActiveRule(client, row);

  if (!rule) {
    const { error } = await client.rpc("complete_meta_lead_consent_processing", {
      p_staging_id: row.id, p_outcome: "no_rule", p_rule_id: null, p_consent_text: null, p_consent_version: null,
    });
    if (error) throw error;
    log("meta_leadgen.consent_no_rule", { stagingId: row.id });
    return { stagingId: row.id, outcome: "no_rule", consentId: null, leadId: row.leadId, organizationId: row.organizationId, workspaceId: row.workspaceId };
  }

  const outcome = evaluateMetaLeadConsent({ customAnswers: row.customAnswers, rule });
  const { data, error } = await client.rpc("complete_meta_lead_consent_processing", {
    p_staging_id: row.id,
    p_outcome: outcome,
    p_rule_id: rule.id,
    p_consent_text: outcome === "unverifiable" ? null : rule.consentStatement,
    p_consent_version: outcome === "unverifiable" ? null : rule.version,
  });
  if (error) throw error;
  const consentId = data ? String(data) : null;

  if (row.leadId && (outcome === "granted" || outcome === "not_granted")) {
    const eventType = outcome === "granted" ? "meta.lead.whatsapp_consent_granted" : "meta.lead.whatsapp_consent_not_granted";
    await Promise.resolve(client.from("activity_events").insert({
      organization_id: row.organizationId, workspace_id: row.workspaceId,
      event_type: eventType, title: "Meta Lead Ads WhatsApp consent " + outcome,
      related_type: "lead", related_id: row.leadId,
      metadata: { consentId, formId: row.formId, status: outcome },
    })).catch(() => undefined);
  }

  log("meta_leadgen.consent_" + outcome, { stagingId: row.id, consentId });
  return { stagingId: row.id, outcome, consentId, leadId: row.leadId, organizationId: row.organizationId, workspaceId: row.workspaceId };
}

/** Part 24/29: the batch entry point for the internal processor route. One bad row never blocks the rest. */
export async function processPendingMetaLeadConsent(
  client: SupabaseClient,
  options: { limit?: number } = {},
): Promise<{ claimed: number; results: readonly MetaConsentProcessingResult[] }> {
  const batch = await claimMetaLeadConsentBatch(client, options.limit ?? defaultConsentBatchLimit);

  const results: MetaConsentProcessingResult[] = [];
  for (const row of batch) {
    try {
      results.push(await processClaimedMetaLeadConsent(client, row));
    } catch (unexpected) {
      log("meta_leadgen.consent_processing_error", { stagingId: row.id, reason: unexpected instanceof Error ? unexpected.name : "unknown" });
      results.push({ stagingId: row.id, outcome: "skipped", consentId: null, leadId: null, organizationId: null, workspaceId: null });
    }
  }
  return { claimed: batch.length, results };
}
