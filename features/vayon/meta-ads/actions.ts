"use server";
import { revalidatePath } from "next/cache";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { MetaAdsService } from "./meta-ads.service";
import type { MetaPublishPlan } from "./meta-ads.types";

const accessError = "Marketing Studio subscription access is required.";

/**
 * No provider is ever called by this action (ADS-B3 scope). It only
 * records a publish REQUEST through MetaAdsService, which only calls the
 * request_meta_campaign_publish RPC -- the actual (fake, in ADS-B3) worker
 * runs separately and is never invoked from a user-facing request.
 */
export async function requestMetaCampaignPublishAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await MetaAdsService.production();
  if (!service) throw new Error(accessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const channelExecutionId = String(formData.get("channelExecutionId") ?? "");
  const plan: MetaPublishPlan = {
    objective: String(formData.get("objective") ?? "").trim() || "lead_generation",
    budget: { currency: "USD", dailyBudget: null, lifetimeBudget: null, startAt: null, endAt: null },
    targeting: {},
    creativeMapping: [],
    leadFormRequired: false,
    leadFormMappingId: null,
    specialAdCategory: null,
    placementIntent: null,
    trackingIdentifiers: {},
  };
  await service.requestPublish(channelExecutionId, plan);
  revalidatePath(`/vayon/creative-studio/campaigns/${campaignId}`);
}
