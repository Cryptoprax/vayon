"use server";
import { revalidatePath } from "next/cache";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { CampaignChannelsService } from "./campaign-channels.service";
import type { ChannelProvider, CampaignLifecycleStatus } from "./campaign-channels.types";

const accessError = "Marketing Studio subscription access is required.";

function campaignPath(campaignId: string): string {
  return `/vayon/creative-studio/campaigns/${campaignId}`;
}

/**
 * No provider is ever called by any action in this file (ADS-B1 scope --
 * Meta/Google adapters remain absent). Each action only records
 * provider-neutral state through CampaignChannelsService, which itself only
 * calls the ADS-B1 RPCs.
 */
export async function selectCampaignChannelAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignChannelsService.production();
  if (!service) throw new Error(accessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const provider = String(formData.get("provider") ?? "") as ChannelProvider;
  await service.selectChannel(campaignId, provider);
  revalidatePath(campaignPath(campaignId));
}

export async function advanceCampaignChannelStatusAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignChannelsService.production();
  if (!service) throw new Error(accessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const executionId = String(formData.get("executionId") ?? "");
  const status = String(formData.get("status") ?? "") as CampaignLifecycleStatus;
  await service.advanceChannelStatus(executionId, status);
  revalidatePath(campaignPath(campaignId));
}

export async function saveCampaignBudgetIntentAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignChannelsService.production();
  if (!service) throw new Error(accessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const dailyBudget = String(formData.get("dailyBudget") ?? "").trim();
  const lifetimeBudget = String(formData.get("lifetimeBudget") ?? "").trim();
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  await service.saveBudgetIntent({
    campaignId,
    currency: String(formData.get("currency") ?? "").trim().toUpperCase(),
    dailyBudget: dailyBudget || null,
    lifetimeBudget: lifetimeBudget || null,
    startAt: startAt || null,
    endAt: endAt || null,
  });
  revalidatePath(campaignPath(campaignId));
}

export async function acceptCampaignBudgetIntentAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignChannelsService.production();
  if (!service) throw new Error(accessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const intentId = String(formData.get("intentId") ?? "");
  await service.acceptBudgetIntent(intentId);
  revalidatePath(campaignPath(campaignId));
}

export async function saveCampaignTargetingIntentAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await CampaignChannelsService.production();
  if (!service) throw new Error(accessError);
  const campaignId = String(formData.get("campaignId") ?? "");
  const asText = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const asNumber = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    return raw ? raw : null;
  };
  await service.saveTargetingIntent({
    campaignId,
    country: asText("country"),
    region: asText("region"),
    city: asText("city"),
    language: asText("language"),
    buyerPersona: asText("buyerPersona"),
    propertyType: asText("propertyType"),
    budgetRangeLow: asNumber("budgetRangeLow"),
    budgetRangeHigh: asNumber("budgetRangeHigh"),
    objective: asText("objective"),
  });
  revalidatePath(campaignPath(campaignId));
}
