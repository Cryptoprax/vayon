export type EvaluationStatus = "pending" | "evaluating" | "passed" | "needs_review" | "rejected" | "failed";

/** The only three states complete_creative_evaluation() accepts as a real outcome. */
export type EvaluationTerminalStatus = "passed" | "needs_review" | "rejected";

export type IssueSeverity = "info" | "warning" | "blocking";

/**
 * Part 4's fixed, documented dimension set. Subjective/quality dimensions
 * carry a 0-100 score; factual dimensions carry a FactualCheck instead (Part
 * 4: "do not invent fake scientific certainty" -- a factual claim is
 * verified/unverified/conflicting/unknown, never a fabricated number).
 */
export const FACTUAL_DIMENSIONS = [
  "property_factual_accuracy",
  "price_accuracy",
  "availability_accuracy",
  "payment_plan_accuracy",
  "location_accuracy",
] as const;
export type FactualDimension = (typeof FACTUAL_DIMENSIONS)[number];

export const QUALITY_DIMENSIONS = [
  "brand_consistency",
  "logo_brand_asset_use",
  "visual_quality",
  "readability",
  "message_clarity",
  "cta_clarity",
  "aspect_ratio_fit",
  "placement_suitability",
  "platform_policy_risk",
  "housing_ad_policy_risk",
  "misleading_generated_imagery_risk",
  "duplicate_near_duplicate_risk",
  "copy_quality",
] as const;
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

export type FactualCheckState = "verified" | "unverified" | "conflict" | "unknown" | "not_applicable";

export interface FactualCheck {
  readonly state: FactualCheckState;
  readonly claimedValue: string | null;
  readonly authoritativeValue: string | null;
  readonly notes: string | null;
}

export interface QualityScore {
  readonly score: number;
  /** "fact" never applies here -- a quality dimension is always an estimate from a provider, real or mock. */
  readonly confidence: "estimate" | "unknown";
  readonly notes: string | null;
}

export type DimensionScores = {
  readonly [K in FactualDimension]?: FactualCheck;
} & {
  readonly [K in QualityDimension]?: QualityScore;
};

export type ClaimType = "property_type" | "bedrooms" | "bathrooms" | "price" | "location" | "amenity" | "payment_plan" | "availability" | "marketing_adjective";

export interface ExtractedClaim {
  readonly type: ClaimType;
  readonly rawText: string;
  readonly extractedValue: string | number | null;
  /** Only checkable claims are ever compared against authoritative facts (Part 6). */
  readonly checkable: boolean;
}

export interface Issue {
  readonly code: string;
  readonly severity: IssueSeverity;
  readonly message: string;
  readonly dimension: FactualDimension | QualityDimension | null;
}

export interface PolicyFlag {
  readonly ruleKey: string;
  readonly category: string;
  readonly severity: IssueSeverity;
  readonly message: string;
  readonly requiresManualReview: boolean;
}

export interface EvidenceRef {
  readonly type: string;
  readonly id: string;
  readonly citation: string;
}

export interface CreativeEvaluation {
  readonly id: string;
  readonly campaignId: string;
  readonly creativeAssetId: string;
  readonly channelExecutionId: string | null;
  readonly version: number;
  readonly status: EvaluationStatus;
  readonly claims: readonly ExtractedClaim[];
  readonly dimensionScores: DimensionScores;
  readonly blockingIssues: readonly Issue[];
  readonly warnings: readonly Issue[];
  readonly recommendations: readonly string[];
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly policyFlags: readonly PolicyFlag[];
  readonly provider: string | null;
  readonly model: string | null;
  readonly evaluationVersion: string | null;
  readonly diagnostic: string | null;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly requestedAt: string;
  readonly completedAt: string | null;
}

/** Part 21: the ADS-B1 integration read shape (are_required_creatives_evaluated). */
export interface CreativeEvaluationReadiness {
  readonly passed: number;
  readonly needsReview: number;
  readonly rejected: number;
  readonly pendingOrEvaluating: number;
  readonly failed: number;
  readonly allPassed: boolean;
  readonly anyRejected: boolean;
}
