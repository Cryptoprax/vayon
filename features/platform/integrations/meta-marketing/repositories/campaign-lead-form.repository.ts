import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignLeadForm, CampaignLeadFormSpecification, CampaignLeadFormStatus } from "../domain/types";

type Row = Record<string, unknown>;
const columns = "id,campaign_id,property_id,connection_id,page_id,version,provider_form_id,form_name,status,specification,form_mapping_id,consent_rule_id,diagnostic,created_at,updated_at";

function toForm(row: Row): CampaignLeadForm {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    propertyId: String(row.property_id),
    connectionId: String(row.connection_id),
    pageId: String(row.page_id),
    version: Number(row.version),
    providerFormId: row.provider_form_id ? String(row.provider_form_id) : null,
    formName: String(row.form_name),
    status: String(row.status) as CampaignLeadFormStatus,
    specification: row.specification as CampaignLeadFormSpecification,
    formMappingId: row.form_mapping_id ? String(row.form_mapping_id) : null,
    consentRuleId: row.consent_rule_id ? String(row.consent_rule_id) : null,
    diagnostic: row.diagnostic ? String(row.diagnostic) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Every write goes through the C6 RPCs (all SECURITY DEFINER, re-deriving the caller's own tenant) -- this repository never performs a raw insert/update against campaign_lead_forms. */
export class CampaignLeadFormRepository {
  constructor(private client: SupabaseClient, private organizationId: string, private workspaceId: string) {}

  async saveDraft(campaignId: string, formName: string, specification: CampaignLeadFormSpecification): Promise<string> {
    const { data, error } = await this.client.rpc("save_campaign_lead_form_draft", {
      p_campaign_id: campaignId,
      p_form_name: formName,
      p_specification: specification,
    });
    if (error) throw error;
    return String(data);
  }

  async claimCreation(localFormId: string): Promise<CampaignLeadForm | null> {
    const { data, error } = await this.client.rpc("claim_campaign_lead_form_creation", { p_local_form_id: localFormId });
    if (error) throw error;
    return data ? toForm(data as Row) : null;
  }

  async completeCreation(localFormId: string, success: boolean, providerFormId: string | null, diagnostic: string | null): Promise<void> {
    const { error } = await this.client.rpc("complete_campaign_lead_form_creation", {
      p_local_form_id: localFormId,
      p_success: success,
      p_provider_form_id: providerFormId,
      p_diagnostic: diagnostic,
    });
    if (error) throw error;
  }

  async markMapped(localFormId: string, formMappingId: string): Promise<void> {
    const { error } = await this.client.rpc("mark_campaign_lead_form_mapped", { p_local_form_id: localFormId, p_form_mapping_id: formMappingId });
    if (error) throw error;
  }
  async markMappingFailed(localFormId: string, diagnostic: string): Promise<void> {
    const { error } = await this.client.rpc("mark_campaign_lead_form_mapping_failed", { p_local_form_id: localFormId, p_diagnostic: diagnostic });
    if (error) throw error;
  }
  async markConsentConfigured(localFormId: string, consentRuleId: string): Promise<void> {
    const { error } = await this.client.rpc("mark_campaign_lead_form_consent_configured", { p_local_form_id: localFormId, p_consent_rule_id: consentRuleId });
    if (error) throw error;
  }
  async markConsentFailed(localFormId: string, diagnostic: string): Promise<void> {
    const { error } = await this.client.rpc("mark_campaign_lead_form_consent_failed", { p_local_form_id: localFormId, p_diagnostic: diagnostic });
    if (error) throw error;
  }

  async listByCampaign(campaignId: string): Promise<readonly CampaignLeadForm[]> {
    const { data, error } = await this.client
      .from("campaign_lead_forms")
      .select(columns)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("campaign_id", campaignId)
      .order("version", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toForm);
  }

  async get(localFormId: string): Promise<CampaignLeadForm | null> {
    const { data, error } = await this.client
      .from("campaign_lead_forms")
      .select(columns)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("id", localFormId)
      .maybeSingle();
    if (error) throw error;
    return data ? toForm(data as Row) : null;
  }
}
