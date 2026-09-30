import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CampaignBudgetIntent,
  CampaignChannelExecution,
  CampaignLifecycleStatus,
  CampaignTargetingIntent,
  ChannelProvider,
  SaveCampaignBudgetIntentInput,
  SaveCampaignTargetingIntentInput,
} from "./campaign-channels.types";

type Row = Record<string, unknown>;

function toExecution(row: Row): CampaignChannelExecution {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    provider: row.provider as ChannelProvider,
    providerAccountId: row.provider_account_id ? String(row.provider_account_id) : null,
    providerCampaignId: row.provider_campaign_id ? String(row.provider_campaign_id) : null,
    status: row.status as CampaignLifecycleStatus,
    publishAttemptCount: Number(row.publish_attempt_count),
    lastErrorCode: row.last_error_code ? String(row.last_error_code) : null,
    lastErrorMessage: row.last_error_message ? String(row.last_error_message) : null,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toBudgetIntent(row: Row): CampaignBudgetIntent {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    version: Number(row.version),
    status: row.status as CampaignBudgetIntent["status"],
    currency: String(row.currency),
    dailyBudget: row.daily_budget !== null ? String(row.daily_budget) : null,
    lifetimeBudget: row.lifetime_budget !== null ? String(row.lifetime_budget) : null,
    startAt: row.start_at ? String(row.start_at) : null,
    endAt: row.end_at ? String(row.end_at) : null,
    createdAt: String(row.created_at),
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
  };
}

function toTargetingIntent(row: Row): CampaignTargetingIntent {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    country: row.country ? String(row.country) : null,
    region: row.region ? String(row.region) : null,
    city: row.city ? String(row.city) : null,
    language: row.language ? String(row.language) : null,
    buyerPersona: row.buyer_persona ? String(row.buyer_persona) : null,
    propertyType: row.property_type ? String(row.property_type) : null,
    budgetRangeLow: row.budget_range_low !== null && row.budget_range_low !== undefined ? String(row.budget_range_low) : null,
    budgetRangeHigh: row.budget_range_high !== null && row.budget_range_high !== undefined ? String(row.budget_range_high) : null,
    objective: row.objective ? String(row.objective) : null,
    updatedAt: String(row.updated_at),
  };
}

/**
 * Every write goes through the ADS-B1 SECURITY DEFINER RPCs -- this
 * repository never performs a raw insert/update against
 * campaign_channel_executions / campaign_budget_intents /
 * campaign_targeting_intents, mirroring CampaignStrategyRepository's own
 * contract.
 */
export class CampaignChannelsRepository {
  constructor(private client: SupabaseClient, private organizationId: string, private workspaceId: string) {}

  async createChannelExecution(campaignId: string, provider: ChannelProvider): Promise<string> {
    const { data, error } = await this.client.rpc("create_campaign_channel_execution", {
      p_campaign_id: campaignId,
      p_provider: provider,
    });
    if (error) throw error;
    return String(data);
  }

  async transitionChannelExecution(executionId: string, status: CampaignLifecycleStatus, errorCode?: string, errorMessage?: string): Promise<void> {
    const { error } = await this.client.rpc("transition_campaign_channel_execution", {
      p_execution_id: executionId,
      p_status: status,
      p_error_code: errorCode ?? null,
      p_error_message: errorMessage ?? null,
    });
    if (error) throw error;
  }

  async listChannelExecutions(campaignId: string): Promise<readonly CampaignChannelExecution[]> {
    const { data, error } = await this.client
      .from("campaign_channel_executions")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toExecution);
  }

  async isSourceApproved(sourceType: string, sourceId: string, actionType: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("is_source_approved", {
      p_organization_id: this.organizationId,
      p_workspace_id: this.workspaceId,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_action_type: actionType,
    });
    if (error) throw error;
    return Boolean(data);
  }

  async saveBudgetIntent(input: SaveCampaignBudgetIntentInput): Promise<string> {
    const { data, error } = await this.client.rpc("save_campaign_budget_intent", {
      p_campaign_id: input.campaignId,
      p_currency: input.currency,
      p_daily_budget: input.dailyBudget,
      p_lifetime_budget: input.lifetimeBudget,
      p_start_at: input.startAt,
      p_end_at: input.endAt,
    });
    if (error) throw error;
    return String(data);
  }

  async acceptBudgetIntent(intentId: string): Promise<void> {
    const { error } = await this.client.rpc("accept_campaign_budget_intent", { p_intent_id: intentId });
    if (error) throw error;
  }

  async listBudgetIntents(campaignId: string): Promise<readonly CampaignBudgetIntent[]> {
    const { data, error } = await this.client
      .from("campaign_budget_intents")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("campaign_id", campaignId)
      .order("version", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toBudgetIntent);
  }

  async saveTargetingIntent(input: SaveCampaignTargetingIntentInput): Promise<string> {
    const { data, error } = await this.client.rpc("save_campaign_targeting_intent", {
      p_campaign_id: input.campaignId,
      p_country: input.country,
      p_region: input.region,
      p_city: input.city,
      p_language: input.language,
      p_buyer_persona: input.buyerPersona,
      p_property_type: input.propertyType,
      p_budget_range_low: input.budgetRangeLow,
      p_budget_range_high: input.budgetRangeHigh,
      p_objective: input.objective,
    });
    if (error) throw error;
    return String(data);
  }

  async getTargetingIntent(campaignId: string): Promise<CampaignTargetingIntent | null> {
    const { data, error } = await this.client
      .from("campaign_targeting_intents")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("campaign_id", campaignId)
      .maybeSingle();
    if (error) throw error;
    return data ? toTargetingIntent(data as Row) : null;
  }

  async getCampaignPublishingStatus(campaignId: string): Promise<CampaignLifecycleStatus | null> {
    const { data, error } = await this.client
      .from("creative_campaigns")
      .select("publishing_status")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("id", campaignId)
      .maybeSingle();
    if (error) throw error;
    return data ? ((data as Row).publishing_status as CampaignLifecycleStatus) : null;
  }
}
