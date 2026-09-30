import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaCampaignPublishExecution, MetaPublishExecutionStatus, MetaPublishPlan, MetaProviderObject, MetaProviderObjectStatus, MetaProviderObjectType } from "./meta-ads.types";

type Row = Record<string, unknown>;

function toExecution(row: Row): MetaCampaignPublishExecution {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    channelExecutionId: String(row.channel_execution_id),
    connectionId: String(row.connection_id),
    plan: (row.plan ?? {}) as MetaPublishPlan,
    status: row.status as MetaPublishExecutionStatus,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    lastErrorCode: row.last_error_code ? String(row.last_error_code) : null,
    lastErrorMessage: row.last_error_message ? String(row.last_error_message) : null,
    requestedAt: String(row.requested_at),
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

function toProviderObject(row: Row): MetaProviderObject {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    channelExecutionId: String(row.channel_execution_id),
    publishExecutionId: String(row.publish_execution_id),
    objectType: row.object_type as MetaProviderObject["objectType"],
    parentObjectId: row.parent_object_id ? String(row.parent_object_id) : null,
    creativeAssetId: row.creative_asset_id ? String(row.creative_asset_id) : null,
    providerObjectId: row.provider_object_id ? String(row.provider_object_id) : null,
    status: row.status as MetaProviderObjectStatus,
    attempts: Number(row.attempts),
    lastErrorCode: row.last_error_code ? String(row.last_error_code) : null,
    lastErrorMessage: row.last_error_message ? String(row.last_error_message) : null,
    lastResponseMetadata: (row.last_response_metadata ?? {}) as Record<string, unknown>,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
  };
}

export interface UpsertProviderObjectInput {
  readonly publishExecutionId: string;
  readonly objectType: MetaProviderObjectType;
  readonly parentObjectId: string | null;
  readonly creativeAssetId: string | null;
  readonly providerObjectId: string | null;
  readonly status: MetaProviderObjectStatus;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly responseMetadata: Readonly<Record<string, unknown>>;
}

/** Every write goes through the ADS-B3 SECURITY DEFINER RPCs -- never a raw insert/update. */
export class MetaAdsRepository {
  constructor(private client: SupabaseClient, private organizationId: string, private workspaceId: string) {}

  async requestPublish(channelExecutionId: string, plan: MetaPublishPlan): Promise<string> {
    const { data, error } = await this.client.rpc("request_meta_campaign_publish", {
      p_channel_execution_id: channelExecutionId,
      p_plan: plan,
    });
    if (error) throw error;
    return String(data);
  }

  async claimPublish(publishExecutionId: string): Promise<MetaCampaignPublishExecution | null> {
    const { data, error } = await this.client.rpc("claim_meta_campaign_publish", { p_publish_execution_id: publishExecutionId });
    if (error) throw error;
    return data ? toExecution(data as Row) : null;
  }

  async upsertProviderObject(input: UpsertProviderObjectInput): Promise<string> {
    const { data, error } = await this.client.rpc("upsert_meta_provider_object", {
      p_publish_execution_id: input.publishExecutionId,
      p_object_type: input.objectType,
      p_parent_object_id: input.parentObjectId,
      p_creative_asset_id: input.creativeAssetId,
      p_provider_object_id: input.providerObjectId,
      p_status: input.status,
      p_error_code: input.errorCode,
      p_error_message: input.errorMessage,
      p_response_metadata: input.responseMetadata,
    });
    if (error) throw error;
    return String(data);
  }

  async completePublish(publishExecutionId: string, success: boolean, status: "succeeded" | "partial_failure" | null, errorCode: string | null, errorMessage: string | null): Promise<void> {
    const { error } = await this.client.rpc("complete_meta_campaign_publish", {
      p_publish_execution_id: publishExecutionId,
      p_success: success,
      p_status: status,
      p_error_code: errorCode,
      p_error_message: errorMessage,
    });
    if (error) throw error;
  }

  async markUncertain(publishExecutionId: string, diagnostic: string): Promise<void> {
    const { error } = await this.client.rpc("mark_meta_campaign_publish_uncertain", {
      p_publish_execution_id: publishExecutionId,
      p_diagnostic: diagnostic,
    });
    if (error) throw error;
  }

  async get(publishExecutionId: string): Promise<MetaCampaignPublishExecution | null> {
    const { data, error } = await this.client
      .from("meta_campaign_publish_executions")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("id", publishExecutionId)
      .maybeSingle();
    if (error) throw error;
    return data ? toExecution(data as Row) : null;
  }

  async listProviderObjects(publishExecutionId: string): Promise<readonly MetaProviderObject[]> {
    const { data, error } = await this.client
      .from("meta_provider_objects")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("publish_execution_id", publishExecutionId)
      .order("object_type", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toProviderObject);
  }
}
