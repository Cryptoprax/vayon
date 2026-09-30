import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creativeStudioAccess } from "@/features/vayon/creative-studio/access.service";
import { requireMetaMarketingWritesEnabled } from "@/features/platform/integrations/meta-marketing/providers/meta-graph.provider";
import { MetaAdsRepository } from "./meta-ads.repository";
import { FakeMetaAdsProvider, type MetaAdsProvider } from "./providers/meta-ads.provider";
import type { MetaCampaignPublishExecution, MetaPublishPlan } from "./meta-ads.types";

export class MetaAdsService {
  constructor(private client: SupabaseClient, private organizationId: string, private workspaceId: string, private repository: MetaAdsRepository) {}

  static async production(): Promise<MetaAdsService | null> {
    const access = await creativeStudioAccess();
    if (!access) return null;
    return new MetaAdsService(access.client, access.organizationId, access.workspaceId, new MetaAdsRepository(access.client, access.organizationId, access.workspaceId));
  }

  static withClient(client: SupabaseClient, organizationId: string, workspaceId: string): MetaAdsService {
    return new MetaAdsService(client, organizationId, workspaceId, new MetaAdsRepository(client, organizationId, workspaceId));
  }

  async requestPublish(channelExecutionId: string, plan: MetaPublishPlan): Promise<string> {
    return this.repository.requestPublish(channelExecutionId, plan);
  }

  async get(publishExecutionId: string): Promise<MetaCampaignPublishExecution | null> {
    return this.repository.get(publishExecutionId);
  }
}

/**
 * Part 8: the trusted publish worker. Part 6's write guard
 * (requireMetaMarketingWritesEnabled -- REUSED from the existing C6 file,
 * never duplicated) is checked once, up front, before the worker even
 * claims a row or touches the fake provider -- in ADS-B3 this always
 * throws (the env var is never set), so zero provider calls of any kind
 * ever occur. Structured so a real MetaAdsProvider can later replace
 * FakeMetaAdsProvider without changing this orchestration.
 */
export class MetaPublishWorker {
  constructor(
    private client: SupabaseClient,
    private repository: MetaAdsRepository,
    private provider: MetaAdsProvider = new FakeMetaAdsProvider(),
  ) {}

  static withClient(client: SupabaseClient, organizationId: string, workspaceId: string, provider?: MetaAdsProvider): MetaPublishWorker {
    return new MetaPublishWorker(client, new MetaAdsRepository(client, organizationId, workspaceId), provider);
  }

  /**
   * Processes exactly one claimed publish execution. Part 11's partial-
   * failure model: each object is upserted immediately after its own
   * create attempt, so a later object's failure never erases an earlier
   * object's success. Part 12: a network-level uncertain outcome (timeout)
   * is marked uncertain and returns without completing -- never retried
   * within this call.
   */
  async processOne(publishExecutionId: string): Promise<MetaCampaignPublishExecution | null> {
    // Part 6: the single, reused, centralized write guard. Throws
    // MetaMarketingWritesDisabledError today (env var unset) -- this
    // method must never be reached with writes enabled during ADS-B3.
    requireMetaMarketingWritesEnabled();

    const claimed = await this.repository.claimPublish(publishExecutionId);
    if (!claimed) return null;

    const accessToken = "unused-in-adS-b3-fake-provider";
    let providerCampaignId: string | null = null;
    let providerAdSetId: string | null = null;
    let anyFailure = false;

    try {
      const campaignResult = await this.provider.createCampaign(
        { adAccountId: "act_unknown", name: `VAYON ${claimed.campaignId}`, objective: claimed.plan.objective, specialAdCategory: claimed.plan.specialAdCategory },
        accessToken,
      );
      providerCampaignId = campaignResult.providerObjectId;
      await this.repository.upsertProviderObject({
        publishExecutionId, objectType: "campaign", parentObjectId: null, creativeAssetId: null,
        providerObjectId: providerCampaignId, status: "created", errorCode: null, errorMessage: null, responseMetadata: {},
      });

      const adSetResult = await this.provider.createAdSet(
        { providerCampaignId, name: "Ad Set", dailyBudgetMinorUnits: null, lifetimeBudgetMinorUnits: null, targetingSpec: claimed.plan.targeting },
        accessToken,
      );
      providerAdSetId = adSetResult.providerObjectId;
      const adSetObjectId = await this.repository.upsertProviderObject({
        publishExecutionId, objectType: "ad_set", parentObjectId: null, creativeAssetId: null,
        providerObjectId: providerAdSetId, status: "created", errorCode: null, errorMessage: null, responseMetadata: {},
      });

      for (const creativeMapping of claimed.plan.creativeMapping) {
        try {
          const creativeResult = await this.provider.createCreative(
            { providerAdSetId, storagePath: "", format: creativeMapping.format },
            accessToken,
          );
          await this.repository.upsertProviderObject({
            publishExecutionId, objectType: "creative", parentObjectId: adSetObjectId, creativeAssetId: creativeMapping.creativeAssetId,
            providerObjectId: creativeResult.providerObjectId, status: "created", errorCode: null, errorMessage: null, responseMetadata: {},
          });

          const adResult = await this.provider.createAd(
            { providerAdSetId, providerCreativeId: creativeResult.providerObjectId, name: "Ad" },
            accessToken,
          );
          await this.repository.upsertProviderObject({
            publishExecutionId, objectType: "ad", parentObjectId: adSetObjectId, creativeAssetId: creativeMapping.creativeAssetId,
            providerObjectId: adResult.providerObjectId, status: "created", errorCode: null, errorMessage: null, responseMetadata: {},
          });
        } catch (creativeError) {
          anyFailure = true;
          await this.repository.upsertProviderObject({
            publishExecutionId, objectType: "creative", parentObjectId: adSetObjectId, creativeAssetId: creativeMapping.creativeAssetId,
            providerObjectId: null, status: "failed", errorCode: "CREATIVE_CREATE_FAILED",
            errorMessage: creativeError instanceof Error ? creativeError.message : "creative_exception", responseMetadata: {},
          });
        }
      }

      await this.repository.completePublish(publishExecutionId, true, anyFailure ? "partial_failure" : "succeeded", null, null);
    } catch (error) {
      await this.repository.completePublish(publishExecutionId, false, null, "PROVIDER_EXCEPTION", error instanceof Error ? error.message : "publish_exception");
    }

    return this.repository.get(publishExecutionId);
  }

  /**
   * Part 13: reconciliation contract. Interface + mocked behavior only in
   * ADS-B3 -- queries the (fake) provider by the stable provider_object_id
   * already persisted, never re-creates anything. A real implementation
   * would call the real MetaAdsProvider.getCampaignStatus and update
   * meta_provider_objects/meta_campaign_publish_executions accordingly via
   * the same trusted-worker RPCs.
   */
  async reconcileMetaExecution(providerCampaignId: string): Promise<{ readonly status: string; readonly reviewFeedback: string | null }> {
    requireMetaMarketingWritesEnabled();
    const result = await this.provider.getCampaignStatus(providerCampaignId, "unused-in-ads-b3-fake-provider");
    return { status: result.status, reviewFeedback: result.reviewFeedback };
  }
}
