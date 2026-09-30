export type MetaPublishExecutionStatus = "pending" | "claimed" | "publishing" | "succeeded" | "partial_failure" | "failed" | "uncertain";
export type MetaProviderObjectType = "campaign" | "ad_set" | "creative" | "ad";
export type MetaProviderObjectStatus = "pending" | "creating" | "created" | "failed" | "uncertain";

/**
 * Part 4: the deterministic publish plan, inspectable before any write.
 * special_ad_category is a free-text placeholder, never a hardcoded Meta
 * enum value asserted as currently correct (Part 14) -- EXTERNAL POLICY
 * VERIFICATION REQUIRED before this field is ever sent to a real provider.
 */
export interface MetaPublishPlan {
  readonly objective: string;
  readonly budget: {
    readonly currency: string;
    readonly dailyBudget: string | null;
    readonly lifetimeBudget: string | null;
    readonly startAt: string | null;
    readonly endAt: string | null;
  };
  readonly targeting: unknown;
  readonly creativeMapping: readonly { readonly creativeAssetId: string; readonly format: string }[];
  readonly leadFormRequired: boolean;
  readonly leadFormMappingId: string | null;
  readonly specialAdCategory: string | null;
  readonly placementIntent: string | null;
  readonly trackingIdentifiers: Readonly<Record<string, string>>;
}

export interface MetaCampaignPublishExecution {
  readonly id: string;
  readonly campaignId: string;
  readonly channelExecutionId: string;
  readonly connectionId: string;
  readonly plan: MetaPublishPlan;
  readonly status: MetaPublishExecutionStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly requestedAt: string;
  readonly claimedAt: string | null;
  readonly completedAt: string | null;
}

export interface MetaProviderObject {
  readonly id: string;
  readonly campaignId: string;
  readonly channelExecutionId: string;
  readonly publishExecutionId: string;
  readonly objectType: MetaProviderObjectType;
  readonly parentObjectId: string | null;
  readonly creativeAssetId: string | null;
  readonly providerObjectId: string | null;
  readonly status: MetaProviderObjectStatus;
  readonly attempts: number;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly lastResponseMetadata: Readonly<Record<string, unknown>>;
  readonly lastSyncedAt: string | null;
}

/** Part 15: no field is ever asserted "verified" without a real, checked Meta spec behind it. */
export type TargetingFieldStatus = "verified" | "unsupported" | "requires_review" | "external_policy_verification_required";

export interface TargetingTranslationResult {
  readonly overallStatus: TargetingFieldStatus;
  readonly fields: Readonly<Record<string, { readonly status: TargetingFieldStatus; readonly notes: string }>>;
  readonly metaTargetingSpec: unknown | null;
}

export type CreativeFormat = "single_image" | "video" | "carousel";

export interface MetaCreativePlanItem {
  readonly creativeAssetId: string;
  readonly format: CreativeFormat;
  readonly storagePath: string;
  readonly evaluationStatus: string;
}
