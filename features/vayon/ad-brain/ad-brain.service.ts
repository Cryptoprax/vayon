import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creativeStudioAccess } from "@/features/vayon/creative-studio/access.service";
import { getAuthoritativePropertyFacts } from "@/features/vayon/property-facts/services/authoritative-property-facts.service";
import { AdBrainRepository } from "./ad-brain.repository";
import { extractClaims } from "./claim-extraction";
import { validateClaimsAgainstFacts } from "./factual-validator";
import { computeOverallStatus } from "./scoring";
import { MockVisualEvaluationProvider, type VisualEvaluationProvider } from "./providers/visual-evaluation.provider";
import { MockCopyEvaluationProvider, type CopyEvaluationProvider } from "./providers/copy-evaluation.provider";
import type { CreativeEvaluation, CreativeEvaluationReadiness, DimensionScores, Issue, PolicyFlag } from "./ad-brain.types";

type Row = Record<string, unknown>;

export class AdBrainService {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
    private repository: AdBrainRepository,
  ) {}

  static async production(): Promise<AdBrainService | null> {
    const access = await creativeStudioAccess();
    if (!access) return null;
    return new AdBrainService(access.client, access.organizationId, access.workspaceId, new AdBrainRepository(access.client, access.organizationId, access.workspaceId));
  }

  static withClient(client: SupabaseClient, organizationId: string, workspaceId: string): AdBrainService {
    return new AdBrainService(client, organizationId, workspaceId, new AdBrainRepository(client, organizationId, workspaceId));
  }

  async requestEvaluation(creativeAssetId: string, channelExecutionId: string | null = null): Promise<string> {
    return this.repository.requestEvaluation(creativeAssetId, channelExecutionId);
  }

  async get(evaluationId: string): Promise<CreativeEvaluation | null> {
    return this.repository.get(evaluationId);
  }

  async listByCreativeAsset(creativeAssetId: string): Promise<readonly CreativeEvaluation[]> {
    return this.repository.listByCreativeAsset(creativeAssetId);
  }

  async readiness(campaignId: string, channelExecutionId: string | null = null): Promise<CreativeEvaluationReadiness> {
    return this.repository.readiness(campaignId, channelExecutionId);
  }
}

/**
 * Part 14/17: the trusted-worker side. Runs entirely against mock providers
 * in ADS-B2 -- no real OpenAI/vision call exists here or anywhere in this
 * phase. Structured so a real VisualEvaluationProvider/CopyEvaluationProvider
 * can be substituted later without changing this orchestration.
 */
export class CreativeEvaluationWorker {
  constructor(
    private client: SupabaseClient,
    private repository: AdBrainRepository,
    private visualProvider: VisualEvaluationProvider = new MockVisualEvaluationProvider(),
    private copyProvider: CopyEvaluationProvider = new MockCopyEvaluationProvider(),
  ) {}

  static withClient(client: SupabaseClient, organizationId: string, workspaceId: string, visualProvider?: VisualEvaluationProvider, copyProvider?: CopyEvaluationProvider): CreativeEvaluationWorker {
    return new CreativeEvaluationWorker(client, new AdBrainRepository(client, organizationId, workspaceId), visualProvider, copyProvider);
  }

  /** Processes exactly one claimed evaluation. Never called with a caller-supplied evaluationId it did not itself claim. */
  async processOne(evaluationId: string): Promise<CreativeEvaluation | null> {
    const claimed = await this.repository.claimEvaluation(evaluationId);
    if (!claimed) return null;

    try {
      const { data: asset, error: assetError } = await this.client
        .from("creative_assets")
        .select("id, campaign_id, prompt, storage_path, mime_type")
        .eq("id", claimed.creativeAssetId)
        .maybeSingle();
      if (assetError) throw assetError;
      const assetRow = asset as Row | null;
      if (!assetRow) throw new Error("Creative asset unavailable during evaluation.");

      const { data: campaign, error: campaignError } = await this.client
        .from("creative_campaigns")
        .select("id, organization_id, workspace_id, property_id")
        .eq("id", claimed.campaignId)
        .maybeSingle();
      if (campaignError) throw campaignError;
      const campaignRow = campaign as Row | null;

      const facts = campaignRow?.property_id
        ? await getAuthoritativePropertyFacts(this.client, {
            organizationId: String(campaignRow.organization_id),
            workspaceId: String(campaignRow.workspace_id),
            propertyId: String(campaignRow.property_id),
          })
        : null;

      const copyText = typeof assetRow.prompt === "string" ? assetRow.prompt : "";
      const claims = extractClaims(copyText);
      const factualResult = validateClaimsAgainstFacts(claims, facts);

      const visualResult = await this.visualProvider.evaluate({
        storagePath: typeof assetRow.storage_path === "string" ? assetRow.storage_path : "",
        mimeType: typeof assetRow.mime_type === "string" ? assetRow.mime_type : null,
        aspectRatioHint: null,
        placementHint: null,
      });
      const copyResult = await this.copyProvider.evaluate({ headline: null, primaryText: copyText, description: null, cta: null });

      const dimensionScores: DimensionScores = {
        ...factualResult.checks,
        visual_quality: { score: visualResult.qualityScore, confidence: "estimate", notes: null },
        readability: { score: visualResult.readabilityScore, confidence: "estimate", notes: null },
        brand_consistency: { score: visualResult.brandVisibilityScore, confidence: "estimate", notes: null },
        logo_brand_asset_use: { score: visualResult.brandVisibilityScore, confidence: "estimate", notes: null },
        cta_clarity: { score: visualResult.ctaVisibilityScore, confidence: "estimate", notes: null },
        message_clarity: { score: copyResult.clarityScore, confidence: "estimate", notes: null },
        copy_quality: { score: copyResult.clarityScore, confidence: "estimate", notes: null },
        placement_suitability: { score: visualResult.placementReady ? 90 : 40, confidence: "estimate", notes: null },
        aspect_ratio_fit: { score: visualResult.placementReady ? 90 : 40, confidence: "estimate", notes: null },
        misleading_generated_imagery_risk: { score: visualResult.misleadingRenderRiskScore, confidence: "estimate", notes: null },
        housing_ad_policy_risk: { score: copyResult.policyRiskMarkers.length > 0 ? 60 : 10, confidence: "estimate", notes: null },
        platform_policy_risk: { score: copyResult.policyRiskMarkers.length > 0 ? 60 : 10, confidence: "estimate", notes: null },
        duplicate_near_duplicate_risk: { score: 10, confidence: "unknown", notes: "No duplicate-detection provider is wired yet." },
      };

      const blockingIssues: Issue[] = [];
      const warnings: Issue[] = [];
      if (visualResult.textOverflowDetected) warnings.push({ code: "TEXT_OVERFLOW", severity: "warning", message: "Text overflow detected in creative.", dimension: "readability" });
      if (visualResult.croppingIssueDetected) warnings.push({ code: "CROPPING_ISSUE", severity: "warning", message: "Cropping issue detected in creative.", dimension: "visual_quality" });
      if (copyResult.lengthCheckSkipped) warnings.push({ code: "LENGTH_LIMITS_UNVERIFIED", severity: "warning", message: "Copy length was not checked against a provider limit -- no authoritative limit was supplied.", dimension: "copy_quality" });
      for (const violation of copyResult.lengthViolations) {
        blockingIssues.push({ code: "LENGTH_EXCEEDED", severity: "blocking", message: `${violation.field} is ${violation.length} characters, exceeding the ${violation.limit}-character limit.`, dimension: "copy_quality" });
      }

      const policyFlags: PolicyFlag[] = copyResult.policyRiskMarkers.map((marker) => ({
        ruleKey: "no_unverifiable_superlatives",
        category: "misleading_claims",
        severity: "warning",
        message: `Copy contains a policy-risk marker: "${marker}".`,
        requiresManualReview: true,
      }));

      const overallStatus = computeOverallStatus({ dimensionScores, blockingIssues, warnings, policyFlags });

      const recommendations: string[] = [];
      if (factualResult.hasConflict) recommendations.push("Correct the conflicting factual claim before resubmitting.");
      if (copyResult.lengthCheckSkipped) recommendations.push("Confirm current platform character limits before publishing.");

      await this.repository.completeEvaluation({
        evaluationId,
        success: true,
        overallStatus,
        claims,
        dimensionScores,
        blockingIssues,
        warnings,
        recommendations,
        evidenceRefs: [],
        policyFlags,
        provider: visualResult.provider,
        model: `${visualResult.model}+${copyResult.model}`,
        evaluationVersion: "ad-brain-v1",
        diagnostic: null,
      });
    } catch (error) {
      await this.repository.completeEvaluation({
        evaluationId,
        success: false,
        overallStatus: null,
        claims: [],
        dimensionScores: {},
        blockingIssues: [],
        warnings: [],
        recommendations: [],
        evidenceRefs: [],
        policyFlags: [],
        provider: null,
        model: null,
        evaluationVersion: null,
        diagnostic: error instanceof Error ? error.message : "evaluation_exception",
      });
    }

    return this.repository.get(evaluationId);
  }
}
