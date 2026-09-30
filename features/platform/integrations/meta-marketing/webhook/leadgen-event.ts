/**
 * Phase M3: parsing/normalization only -- pure functions, no I/O. Extracts
 * only Lead Ads ("leadgen") changes from Meta's webhook envelope and reduces
 * each to identifiers only. Never touches field_data (Meta does not even
 * include it in the webhook payload -- that is a separate Graph API call
 * M4 owns), never stores the raw envelope, never stores lead PII.
 */
export interface RawLeadgenChange {
  readonly leadgenId: string;
  readonly pageId: string;
  readonly formId: string;
  readonly adId: string | null;
  readonly adGroupId: string | null;
  readonly createdTime: string | null;
}

/** Meta lead ads Graph object; not a persisted type -- this is the future M4 read model referenced by Phase M3 Part 24. */
export interface MetaLeadgenEvent {
  readonly eventId: string;
  readonly leadgenId: string;
  readonly organizationId: string | null;
  readonly workspaceId: string | null;
  readonly connectionId: string | null;
  readonly propertyId: string | null;
  readonly campaignId: string | null;
  readonly pageId: string;
  readonly formId: string;
  readonly adId: string | null;
  readonly adGroupId: string | null;
  readonly status: "processed" | "unresolved" | "duplicate";
}

function safeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 200 ? trimmed : null;
}

/** Meta sends created_time as unix seconds; returns null (not "now") when absent or invalid rather than guessing. */
function normalizeCreatedTime(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Ignores every non-"leadgen" change and every malformed leadgen change
 * (missing leadgen_id/page_id/form_id) safely -- one bad entry/change never
 * discards the rest of a batched payload (Part 5/21).
 */
export function extractLeadgenChanges(payload: unknown): readonly RawLeadgenChange[] {
  const changes: RawLeadgenChange[] = [];
  const entries = (payload as { entry?: unknown })?.entry;
  if (!Array.isArray(entries)) return changes;

  for (const entry of entries) {
    const entryChanges = (entry as { changes?: unknown } | null)?.changes;
    if (!Array.isArray(entryChanges)) continue;

    for (const change of entryChanges) {
      const record = change as { field?: unknown; value?: unknown } | null;
      if (!record || record.field !== "leadgen") continue;
      const value = record.value as Record<string, unknown> | null;
      if (!value || typeof value !== "object") continue;

      const leadgenId = safeString(value.leadgen_id);
      const pageId = safeString(value.page_id);
      const formId = safeString(value.form_id);
      if (!leadgenId || !pageId || !formId) continue;

      changes.push({
        leadgenId,
        pageId,
        formId,
        adId: safeString(value.ad_id),
        adGroupId: safeString(value.adgroup_id),
        createdTime: normalizeCreatedTime(value.created_time),
      });
    }
  }
  return changes;
}
