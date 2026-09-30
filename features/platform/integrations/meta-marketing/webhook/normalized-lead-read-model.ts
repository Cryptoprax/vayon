import type { CustomAnswer } from "./normalize-lead";

/**
 * Part 18/20: the clean read model M5 will consume. M4 does not expose a
 * live query for this yet (nothing calls the shape below) -- it exists so
 * M5 has a stable target to read `meta_lead_ingestion_staging` rows
 * (status='fetched') into, without ever needing to call Meta again itself.
 */
export interface MetaNormalizedLead {
  readonly stagingId: string;
  readonly providerLeadId: string;
  readonly fullName: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly normalizedPhone: string | null;
  readonly city: string | null;
  readonly customAnswers: readonly CustomAnswer[];
  readonly createdTime: string | null;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly propertyId: string;
  readonly connectionId: string;
  readonly pageId: string;
  readonly formId: string;
  readonly campaignId: string | null;
  readonly adId: string | null;
  readonly adGroupId: string | null;
}

export function toMetaNormalizedLead(row: Record<string, unknown>): MetaNormalizedLead {
  return {
    stagingId: String(row.id),
    providerLeadId: String(row.leadgen_id),
    fullName: row.normalized_full_name ? String(row.normalized_full_name) : null,
    firstName: row.normalized_first_name ? String(row.normalized_first_name) : null,
    lastName: row.normalized_last_name ? String(row.normalized_last_name) : null,
    email: row.normalized_email ? String(row.normalized_email) : null,
    phone: row.normalized_phone_raw ? String(row.normalized_phone_raw) : null,
    normalizedPhone: row.normalized_phone ? String(row.normalized_phone) : null,
    city: row.normalized_city ? String(row.normalized_city) : null,
    customAnswers: Array.isArray(row.custom_answers) ? (row.custom_answers as CustomAnswer[]) : [],
    createdTime: row.provider_created_time ? String(row.provider_created_time) : null,
    organizationId: String(row.organization_id),
    workspaceId: String(row.workspace_id),
    propertyId: String(row.property_id),
    connectionId: String(row.connection_id),
    pageId: String(row.page_id),
    formId: String(row.form_id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    adId: row.ad_id ? String(row.ad_id) : null,
    adGroupId: row.ad_group_id ? String(row.ad_group_id) : null,
  };
}
