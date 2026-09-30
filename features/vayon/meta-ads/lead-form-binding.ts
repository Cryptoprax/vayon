/**
 * Part 17: audits campaign_lead_forms (already real, existing infrastructure
 * -- C6/ADS-B1) to determine whether a campaign's Meta lead form still needs
 * to be created, or can be reused. Read-only; never creates a real Meta
 * lead form.
 */
export interface CampaignLeadFormInput {
  readonly status: string;
  readonly providerFormId: string | null;
  readonly formMappingId: string | null;
}

export type LeadFormRequirement =
  | { readonly required: false; readonly reason: "no_lead_form_configured" }
  | { readonly required: true; readonly reason: "creation_needed" }
  | { readonly required: true; readonly reason: "mapping_needed"; readonly providerFormId: string }
  | { readonly required: false; readonly reason: "reusable"; readonly formMappingId: string };

export function resolveLeadFormRequirement(latest: CampaignLeadFormInput | null): LeadFormRequirement {
  if (!latest) return { required: false, reason: "no_lead_form_configured" };
  if (latest.status === "created" && latest.formMappingId) return { required: false, reason: "reusable", formMappingId: latest.formMappingId };
  if (latest.status === "created" && latest.providerFormId) return { required: true, reason: "mapping_needed", providerFormId: latest.providerFormId };
  return { required: true, reason: "creation_needed" };
}
