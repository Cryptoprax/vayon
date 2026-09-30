import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaMarketingConnection, MetaLeadFormMapping, MetaConnectionStatus, MetaFormMappingStatus, MetaLeadFormConsentRule } from "../domain/types";

type Row = Record<string, unknown>;

/**
 * The customer-facing column list deliberately excludes
 * access_token_ciphertext/access_token_iv/access_token_tag. RLS cannot hide
 * individual columns, so this explicit allowlist -- not the database -- is
 * the boundary that keeps encrypted token material out of every normal
 * customer read. Only getEncryptedToken() below selects those columns, and
 * it is used solely by server-only Graph-call code, never by a page/action
 * that renders to the browser.
 */
const connectionColumns =
  "id,business_id,page_id,page_name,ad_account_id,ad_account_name,instagram_business_account_id,token_expires_at,scopes,status,connected_at,updated_at";

function toConnection(row: Row): MetaMarketingConnection {
  return {
    id: String(row.id),
    businessId: row.business_id ? String(row.business_id) : null,
    pageId: String(row.page_id),
    pageName: row.page_name ? String(row.page_name) : null,
    adAccountId: row.ad_account_id ? String(row.ad_account_id) : null,
    adAccountName: row.ad_account_name ? String(row.ad_account_name) : null,
    instagramBusinessAccountId: row.instagram_business_account_id ? String(row.instagram_business_account_id) : null,
    tokenExpiresAt: row.token_expires_at ? String(row.token_expires_at) : null,
    scopes: Array.isArray(row.scopes) ? (row.scopes as unknown[]).map(String) : [],
    status: row.status as MetaConnectionStatus,
    connectedAt: String(row.connected_at),
    updatedAt: String(row.updated_at),
  };
}

const mappingColumns = "id,connection_id,page_id,form_id,form_name,property_id,campaign_id,status,created_at";

function toMapping(row: Row): MetaLeadFormMapping {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    pageId: String(row.page_id),
    formId: String(row.form_id),
    formName: row.form_name ? String(row.form_name) : null,
    propertyId: String(row.property_id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    status: row.status as MetaFormMappingStatus,
    createdAt: String(row.created_at),
  };
}

export class MetaMarketingRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}

  async connection(): Promise<MetaMarketingConnection | null> {
    const { data, error } = await this.client
      .from("meta_marketing_connections")
      .select(connectionColumns)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data ? toConnection(data) : null;
  }

  /** Server-only: used exclusively by future Graph-call code, never by a customer-facing read. */
  async getEncryptedToken(connectionId: string): Promise<{ ciphertext: string; iv: string; tag: string } | null> {
    const { data, error } = await this.client
      .from("meta_marketing_connections")
      .select("access_token_ciphertext,access_token_iv,access_token_tag")
      .eq("id", connectionId)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Row;
    return { ciphertext: String(row.access_token_ciphertext), iv: String(row.access_token_iv), tag: String(row.access_token_tag) };
  }

  async connect(input: {
    businessId: string | null;
    pageId: string;
    pageName: string | null;
    adAccountId: string | null;
    adAccountName: string | null;
    instagramBusinessAccountId: string | null;
    tokenCiphertext: string;
    tokenIv: string;
    tokenTag: string;
    tokenExpiresAt: string | null;
    scopes: readonly string[];
  }): Promise<string> {
    const { data, error } = await this.client.rpc("connect_meta_marketing_page", {
      p_workspace_id: this.workspaceId,
      p_business_id: input.businessId,
      p_page_id: input.pageId,
      p_page_name: input.pageName,
      p_ad_account_id: input.adAccountId,
      p_ad_account_name: input.adAccountName,
      p_instagram_business_account_id: input.instagramBusinessAccountId,
      p_token_ciphertext: input.tokenCiphertext,
      p_token_iv: input.tokenIv,
      p_token_tag: input.tokenTag,
      p_token_expires_at: input.tokenExpiresAt,
      p_scopes: [...input.scopes],
    });
    if (error) throw error;
    return String(data);
  }

  async disconnect(): Promise<void> {
    const { error } = await this.client.rpc("disconnect_meta_marketing", { p_workspace_id: this.workspaceId });
    if (error) throw error;
  }

  async listFormMappings(): Promise<readonly MetaLeadFormMapping[]> {
    const { data, error } = await this.client
      .from("meta_lead_form_mappings")
      .select(mappingColumns)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toMapping);
  }

  async createFormMapping(input: {
    connectionId: string;
    pageId: string;
    formId: string;
    formName: string | null;
    propertyId: string;
    campaignId: string | null;
  }): Promise<string> {
    const { data, error } = await this.client.rpc("create_meta_lead_form_mapping", {
      p_workspace_id: this.workspaceId,
      p_connection_id: input.connectionId,
      p_page_id: input.pageId,
      p_form_id: input.formId,
      p_form_name: input.formName,
      p_property_id: input.propertyId,
      p_campaign_id: input.campaignId,
    });
    if (error) throw error;
    return String(data);
  }

  async disableFormMapping(mappingId: string): Promise<void> {
    const { error } = await this.client.rpc("disable_meta_lead_form_mapping", { p_workspace_id: this.workspaceId, p_mapping_id: mappingId });
    if (error) throw error;
  }

  /**
   * Phase M4 (Part 17): counts only, never a PII column -- the RPC itself
   * (get_meta_lead_ingestion_summary) only returns status+count, so there is
   * structurally nothing for this method to leak even if misused.
   */
  async leadIngestionSummary(): Promise<Readonly<Record<string, number>>> {
    const { data, error } = await this.client.rpc("get_meta_lead_ingestion_summary", { p_workspace_id: this.workspaceId });
    if (error) throw error;
    const summary: Record<string, number> = {};
    for (const row of (data ?? []) as Row[]) summary[String(row.status)] = Number(row.count);
    return summary;
  }

  /**
   * Phase M5 (Part 30): counts only, keyed by crm_ingestion_status -- the
   * RPC itself (get_meta_lead_crm_ingestion_summary) only returns status+
   * count, so there is structurally nothing for this method to leak.
   */
  async crmIngestionSummary(): Promise<Readonly<Record<string, number>>> {
    const { data, error } = await this.client.rpc("get_meta_lead_crm_ingestion_summary", { p_workspace_id: this.workspaceId });
    if (error) throw error;
    const summary: Record<string, number> = {};
    for (const row of (data ?? []) as Row[]) summary[String(row.status)] = Number(row.count);
    return summary;
  }

  /** Phase M6: the currently active consent rule for a form mapping, if any -- never inferred, only what an admin explicitly configured. */
  async activeConsentRule(formMappingId: string): Promise<MetaLeadFormConsentRule | null> {
    const { data, error } = await this.client
      .from("meta_lead_form_consent_rules")
      .select("id,form_mapping_id,channel,purpose,consent_field_name,accepted_values,consent_statement,version,active,created_at")
      .eq("form_mapping_id", formMappingId)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return data ? toConsentRule(data as Row) : null;
  }

  async configureConsentRule(input: {
    formMappingId: string;
    consentFieldName: string;
    acceptedValues: readonly string[];
    consentStatement: string;
  }): Promise<string> {
    const { data, error } = await this.client.rpc("configure_meta_lead_form_consent_rule", {
      p_workspace_id: this.workspaceId,
      p_form_mapping_id: input.formMappingId,
      p_consent_field_name: input.consentFieldName,
      p_accepted_values: [...input.acceptedValues],
      p_consent_statement: input.consentStatement,
    });
    if (error) throw error;
    return String(data);
  }

  async disableConsentRule(ruleId: string): Promise<void> {
    const { error } = await this.client.rpc("disable_meta_lead_form_consent_rule", { p_workspace_id: this.workspaceId, p_rule_id: ruleId });
    if (error) throw error;
  }
}

function toConsentRule(row: Row): MetaLeadFormConsentRule {
  return {
    id: String(row.id),
    formMappingId: String(row.form_mapping_id),
    channel: "whatsapp",
    purpose: "marketing",
    consentFieldName: String(row.consent_field_name),
    acceptedValues: Array.isArray(row.accepted_values) ? (row.accepted_values as unknown[]).map(String) : [],
    consentStatement: String(row.consent_statement),
    version: Number(row.version),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}
