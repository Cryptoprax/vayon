"use server";
import { revalidatePath } from "next/cache";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
import { AdBrainService } from "./ad-brain.service";

const accessError = "Marketing Studio subscription access is required.";

/**
 * No provider is ever called by this action (ADS-B2 scope). It only
 * records a pending evaluation request through AdBrainService, which only
 * calls the ADS-B2 RPC. Completion happens via a trusted worker
 * (CreativeEvaluationWorker), never from a user-facing action.
 */
export async function requestCreativeEvaluationAction(formData: FormData) {
  await guardSubscriptionAction();
  const service = await AdBrainService.production();
  if (!service) throw new Error(accessError);
  const creativeAssetId = String(formData.get("creativeAssetId") ?? "");
  const channelExecutionId = String(formData.get("channelExecutionId") ?? "").trim() || null;
  const campaignId = String(formData.get("campaignId") ?? "");
  await service.requestEvaluation(creativeAssetId, channelExecutionId);
  revalidatePath(`/vayon/creative-studio/campaigns/${campaignId}`);
}
