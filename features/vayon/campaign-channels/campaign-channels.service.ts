import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creativeStudioAccess } from "@/features/vayon/creative-studio/access.service";
import { CampaignChannelsRepository } from "./campaign-channels.repository";
import {
  CAMPAIGN_CHANNEL_EXECUTION_SOURCE_TYPE,
  CAMPAIGN_CHANNEL_PUBLISH_ACTION,
  CAMPAIGN_BUDGET_INTENT_SOURCE_TYPE,
  CAMPAIGN_BUDGET_CHANGE_ACTION,
  type CampaignBudgetIntent,
  type CampaignChannelExecution,
  type CampaignLifecycleStatus,
  type CampaignTargetingIntent,
  type ChannelProvider,
  type SaveCampaignBudgetIntentInput,
  type SaveCampaignTargetingIntentInput,
} from "./campaign-channels.types";

/**
 * No Meta/Google adapter exists yet (ADS-B1 scope). This service only
 * records provider-neutral state; publishConfirmed()/publishReady() below
 * tell a future C7 worker whether the database invariant would allow a real
 * publish attempt -- neither ever calls a provider or reaches this far by
 * itself.
 */
export class CampaignChannelsService {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
    private repository: CampaignChannelsRepository,
  ) {}

  static async production(): Promise<CampaignChannelsService | null> {
    const access = await creativeStudioAccess();
    if (!access) return null;
    return new CampaignChannelsService(
      access.client,
      access.organizationId,
      access.workspaceId,
      new CampaignChannelsRepository(access.client, access.organizationId, access.workspaceId),
    );
  }

  static withClient(client: SupabaseClient, organizationId: string, workspaceId: string): CampaignChannelsService {
    return new CampaignChannelsService(client, organizationId, workspaceId, new CampaignChannelsRepository(client, organizationId, workspaceId));
  }

  async selectChannel(campaignId: string, provider: ChannelProvider): Promise<string> {
    return this.repository.createChannelExecution(campaignId, provider);
  }

  async listChannels(campaignId: string): Promise<readonly CampaignChannelExecution[]> {
    return this.repository.listChannelExecutions(campaignId);
  }

  async advanceChannelStatus(executionId: string, status: CampaignLifecycleStatus, errorCode?: string, errorMessage?: string): Promise<void> {
    await this.repository.transitionChannelExecution(executionId, status, errorCode, errorMessage);
  }

  /**
   * Approval readiness (Part 12): whether this specific execution currently
   * has an approved D1 approval_requests row for the publish action. This
   * mirrors, from the read side, the exact check
   * transition_campaign_channel_execution() enforces server-side -- callers
   * can show "ready to publish" in the UI without needing to attempt (and
   * fail) a real status transition first.
   */
  async isChannelReadyToPublish(execution: CampaignChannelExecution): Promise<boolean> {
    return this.repository.isSourceApproved(CAMPAIGN_CHANNEL_EXECUTION_SOURCE_TYPE, execution.id, CAMPAIGN_CHANNEL_PUBLISH_ACTION);
  }

  async saveBudgetIntent(input: SaveCampaignBudgetIntentInput): Promise<string> {
    return this.repository.saveBudgetIntent(input);
  }

  async listBudgetIntents(campaignId: string): Promise<readonly CampaignBudgetIntent[]> {
    return this.repository.listBudgetIntents(campaignId);
  }

  async isBudgetIntentApproved(intent: CampaignBudgetIntent): Promise<boolean> {
    return this.repository.isSourceApproved(CAMPAIGN_BUDGET_INTENT_SOURCE_TYPE, intent.id, CAMPAIGN_BUDGET_CHANGE_ACTION);
  }

  async acceptBudgetIntent(intentId: string): Promise<void> {
    await this.repository.acceptBudgetIntent(intentId);
  }

  async saveTargetingIntent(input: SaveCampaignTargetingIntentInput): Promise<string> {
    return this.repository.saveTargetingIntent(input);
  }

  async getTargetingIntent(campaignId: string): Promise<CampaignTargetingIntent | null> {
    return this.repository.getTargetingIntent(campaignId);
  }

  async getCampaignPublishingStatus(campaignId: string): Promise<CampaignLifecycleStatus | null> {
    return this.repository.getCampaignPublishingStatus(campaignId);
  }
}
