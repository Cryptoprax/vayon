import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreativeEvaluation, CreativeEvaluationReadiness, DimensionScores, EvaluationTerminalStatus, EvidenceRef, ExtractedClaim, Issue, PolicyFlag } from "./ad-brain.types";

type Row = Record<string, unknown>;

function toEvaluation(row: Row): CreativeEvaluation {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    creativeAssetId: String(row.creative_asset_id),
    channelExecutionId: row.channel_execution_id ? String(row.channel_execution_id) : null,
    version: Number(row.version),
    status: row.status as CreativeEvaluation["status"],
    claims: (row.claims ?? []) as ExtractedClaim[],
    dimensionScores: (row.dimension_scores ?? {}) as DimensionScores,
    blockingIssues: (row.blocking_issues ?? []) as Issue[],
    warnings: (row.warnings ?? []) as Issue[],
    recommendations: (row.recommendations ?? []) as string[],
    evidenceRefs: (row.evidence_refs ?? []) as EvidenceRef[],
    policyFlags: (row.policy_flags ?? []) as PolicyFlag[],
    provider: row.provider ? String(row.provider) : null,
    model: row.model ? String(row.model) : null,
    evaluationVersion: row.evaluation_version ? String(row.evaluation_version) : null,
    diagnostic: row.diagnostic ? String(row.diagnostic) : null,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    requestedAt: String(row.requested_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

export interface CompleteEvaluationInput {
  readonly evaluationId: string;
  readonly success: boolean;
  readonly overallStatus: EvaluationTerminalStatus | null;
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
}

/**
 * Every write goes through the ADS-B2 SECURITY DEFINER RPCs -- this
 * repository never performs a raw insert/update against
 * creative_evaluations, mirroring CampaignChannelsRepository's own
 * contract.
 */
export class AdBrainRepository {
  constructor(private client: SupabaseClient, private organizationId: string, private workspaceId: string) {}

  async requestEvaluation(creativeAssetId: string, channelExecutionId: string | null): Promise<string> {
    const { data, error } = await this.client.rpc("request_creative_evaluation", {
      p_creative_asset_id: creativeAssetId,
      p_channel_execution_id: channelExecutionId,
    });
    if (error) throw error;
    return String(data);
  }

  async claimEvaluation(evaluationId: string): Promise<CreativeEvaluation | null> {
    const { data, error } = await this.client.rpc("claim_creative_evaluation", { p_evaluation_id: evaluationId });
    if (error) throw error;
    return data ? toEvaluation(data as Row) : null;
  }

  async completeEvaluation(input: CompleteEvaluationInput): Promise<void> {
    const { error } = await this.client.rpc("complete_creative_evaluation", {
      p_evaluation_id: input.evaluationId,
      p_success: input.success,
      p_overall_status: input.overallStatus,
      p_claims: input.claims,
      p_dimension_scores: input.dimensionScores,
      p_blocking_issues: input.blockingIssues,
      p_warnings: input.warnings,
      p_recommendations: input.recommendations,
      p_evidence_refs: input.evidenceRefs,
      p_policy_flags: input.policyFlags,
      p_provider: input.provider,
      p_model: input.model,
      p_evaluation_version: input.evaluationVersion,
      p_diagnostic: input.diagnostic,
    });
    if (error) throw error;
  }

  async get(evaluationId: string): Promise<CreativeEvaluation | null> {
    const { data, error } = await this.client
      .from("creative_evaluations")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("id", evaluationId)
      .maybeSingle();
    if (error) throw error;
    return data ? toEvaluation(data as Row) : null;
  }

  async listByCreativeAsset(creativeAssetId: string): Promise<readonly CreativeEvaluation[]> {
    const { data, error } = await this.client
      .from("creative_evaluations")
      .select("*")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("creative_asset_id", creativeAssetId)
      .order("version", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Row[]).map(toEvaluation);
  }

  async readiness(campaignId: string, channelExecutionId: string | null): Promise<CreativeEvaluationReadiness> {
    const { data, error } = await this.client.rpc("are_required_creatives_evaluated", {
      p_campaign_id: campaignId,
      p_channel_execution_id: channelExecutionId,
    });
    if (error) throw error;
    const row = (data ?? {}) as Row;
    return {
      passed: Number(row.passed ?? 0),
      needsReview: Number(row.needsReview ?? 0),
      rejected: Number(row.rejected ?? 0),
      pendingOrEvaluating: Number(row.pendingOrEvaluating ?? 0),
      failed: Number(row.failed ?? 0),
      allPassed: Boolean(row.allPassed),
      anyRejected: Boolean(row.anyRejected),
    };
  }
}
