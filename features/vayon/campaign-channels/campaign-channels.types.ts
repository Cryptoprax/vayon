export type ChannelProvider = "meta" | "google";

/**
 * Shared across creative_campaigns.publishing_status (the campaign-level
 * state) and campaign_channel_executions.status (the per-channel state).
 * They are separate columns/tables (Part 2's "provider-specific status must
 * remain separate") but reuse this vocabulary rather than inventing a
 * second, parallel enum with no real behavioral difference.
 */
export type CampaignLifecycleStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "publishing"
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "uncertain";

export interface CampaignChannelExecution {
  readonly id: string;
  readonly campaignId: string;
  readonly provider: ChannelProvider;
  readonly providerAccountId: string | null;
  readonly providerCampaignId: string | null;
  readonly status: CampaignLifecycleStatus;
  readonly publishAttemptCount: number;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly lastSyncedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CampaignBudgetIntent {
  readonly id: string;
  readonly campaignId: string;
  readonly version: number;
  readonly status: "draft" | "approved";
  readonly currency: string;
  readonly dailyBudget: string | null;
  readonly lifetimeBudget: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
  readonly createdAt: string;
  readonly approvedAt: string | null;
  readonly approvedBy: string | null;
}

export interface CampaignTargetingIntent {
  readonly id: string;
  readonly campaignId: string;
  readonly country: string | null;
  readonly region: string | null;
  readonly city: string | null;
  readonly language: string | null;
  readonly buyerPersona: string | null;
  readonly propertyType: string | null;
  readonly budgetRangeLow: string | null;
  readonly budgetRangeHigh: string | null;
  readonly objective: string | null;
  readonly updatedAt: string;
}

export interface SaveCampaignBudgetIntentInput {
  readonly campaignId: string;
  readonly currency: string;
  readonly dailyBudget: string | null;
  readonly lifetimeBudget: string | null;
  readonly startAt: string | null;
  readonly endAt: string | null;
}

export interface SaveCampaignTargetingIntentInput {
  readonly campaignId: string;
  readonly country: string | null;
  readonly region: string | null;
  readonly city: string | null;
  readonly language: string | null;
  readonly buyerPersona: string | null;
  readonly propertyType: string | null;
  readonly budgetRangeLow: string | null;
  readonly budgetRangeHigh: string | null;
  readonly objective: string | null;
}

/**
 * The exact D1 approval_requests source/action identifiers ADS-B1 binds to
 * (Part 5). No provider publishing may proceed unless
 * is_source_approved(...) for CAMPAIGN_CHANNEL_PUBLISH_ACTION returns true --
 * enforced in the database by transition_campaign_channel_execution(), not
 * only here.
 */
export const CAMPAIGN_CHANNEL_EXECUTION_SOURCE_TYPE = "campaign_channel_execution" as const;
export const CAMPAIGN_CHANNEL_PUBLISH_ACTION = "campaign_channel_publish" as const;
export const CAMPAIGN_BUDGET_INTENT_SOURCE_TYPE = "campaign_budget_intent" as const;
export const CAMPAIGN_BUDGET_CHANGE_ACTION = "campaign_budget_change" as const;
