"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreativeStudioService } from "./service";
import { audiences, campaignTypes, creativePlatforms, type CampaignBrief } from "./domain";
import { CreativeGenerationService } from "./generation.service";
import { creativeStudioAccess } from "./access.service";
import { GrowthStudioService } from "./growth.service";

const accessError = "Marketing Studio subscription access is required.";

export async function createCreativeDraftAction(formData: FormData) {
  let saved = false;
  try {
    const service = await CreativeStudioService.production();
    if (!service) throw new Error(accessError);
    const campaignType = String(formData.get("campaignType"));
    const selectedAudiences = formData.getAll("audience").map(String);
    const platforms = formData.getAll("platform").map(String);
    if (!campaignTypes.includes(campaignType as never) || selectedAudiences.some((x) => !audiences.includes(x as never)) || platforms.some((x) => !creativePlatforms.includes(x as never))) throw new Error("Invalid campaign selection.");
    const brief: CampaignBrief = { projectId: String(formData.get("projectId")), campaignType: campaignType as CampaignBrief["campaignType"], audiences: selectedAudiences as CampaignBrief["audiences"], platforms: platforms as CampaignBrief["platforms"], language: String(formData.get("language") ?? "English").slice(0, 40), objective: String(formData.get("objective") ?? "").slice(0, 1000) };
    await service.saveDraft(brief, String(formData.get("name") ?? "Untitled campaign").slice(0, 160));
    saved = true;
  } catch {
    console.error("[marketing-studio] Campaign draft could not be saved.");
  }
  if (!saved) redirect("/vayon/creative/campaigns?error=Campaign%20draft%20could%20not%20be%20saved.%20Please%20try%20again.");
  revalidatePath("/vayon/creative/campaigns");
  revalidatePath("/vayon/creative");
  redirect("/vayon/creative?success=Campaign%20draft%20saved");
}

export async function generateCreativeAssetAction(formData: FormData) {
  await new CreativeGenerationService().assistant(String(formData.get("prompt") ?? ""), String(formData.get("projectId") ?? "") || undefined);
  revalidatePath("/vayon/creative-studio/assistant");
}

export async function creativeAssistantChatAction(_previous: { message: string; jobId: string | null }, formData: FormData) {
  try {
    const result = await new CreativeGenerationService().assistant(String(formData.get("prompt") ?? ""), String(formData.get("projectId") ?? "") || undefined);
    revalidatePath("/vayon/creative-studio/assistant");
    return { message: `${result.intent.intentSummary}. ${result.message}`, jobId: result.jobId };
  } catch {
    console.error("[marketing-studio] Creative generation request unavailable.");
    return { message: "AI generation is temporarily unavailable. Your existing drafts are safe, and you can continue with templates, Brand Kit, Asset Library, and the editor.", jobId: null };
  }
}

export async function autosaveCreativeEditorAction(formData: FormData) {
  const access = await creativeStudioAccess();
  if (!access) throw new Error(accessError);
  const raw = String(formData.get("elements") ?? "[]");
  const elements = JSON.parse(raw) as unknown;
  if (!Array.isArray(elements) || raw.length > 100000) throw new Error("Invalid editor document.");
  const { error } = await access.client.rpc("autosave_creative_editor", { p_asset_id: String(formData.get("assetId")), p_expected_revision: Number(formData.get("revision")), p_elements: elements });
  if (error) throw error;
  revalidatePath(`/vayon/creative-studio/editor/${String(formData.get("assetId"))}`);
}

export async function growthCampaignChatAction(_previous: { message: string; campaignId: string | null }, formData: FormData) {
  const result = await new GrowthStudioService().assistant(String(formData.get("prompt") ?? ""), String(formData.get("projectId") ?? "") || undefined, String(formData.get("language") ?? "English"));
  revalidatePath("/vayon/creative-studio/growth");
  revalidatePath("/vayon/creative-studio/packs");
  return result;
}
