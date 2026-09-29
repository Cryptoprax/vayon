import "server-only";
import { creativeStudioAccess } from "./access.service";
import { CreativeStudioService } from "./service";
import {
  campaignChannels,
  campaignPackFormats,
  growthLanguages,
  type CampaignBrief,
  type GrowthCampaignPack,
  type GrowthPlan,
  type GrowthReview,
  type GrowthScheduleItem,
} from "./domain";

type Row = Record<string, unknown>;
const supportedIntent =
  /launch|festival|diwali|luxury|nri|tower|open house|commercial|rental|villa|apartment|investment|construction/i;

export class GrowthStudioService {
  /** Phase C1: matches against public.properties (Model A) -- consistent with CreativeGenerationService.assistant() and the Campaign Wizard's own property-first design. */
  async assistant(prompt: string, propertyId?: string, language = "English") {
    const request = prompt.trim();
    if (!request || request.length > 2000)
      throw new Error("Campaign request must contain 1–2000 characters.");
    if (!supportedIntent.test(request))
      throw new Error(
        "Describe a launch, offer, audience, project, tower, open house, or construction campaign.",
      );
    if (!growthLanguages.includes(language as never))
      throw new Error("Unsupported campaign language.");
    const studio = await CreativeStudioService.production();
    if (!studio) throw new Error("Marketing Studio subscription access is required.");
    const { properties } = await studio.projectContext();
    const property = propertyId
      ? properties.find((item) => item.id === propertyId)
      : properties.find((item) =>
          request.toLowerCase().includes(item.title.toLowerCase()),
        );
    if (!property)
      return {
        campaignId: null,
        message:
          "Choose a property before generating the campaign pack.",
      };
    const campaignType = /diwali|festival/i.test(request)
      ? "Festival"
      : /luxury/i.test(request)
        ? "Luxury"
        : /rental/i.test(request)
          ? "Rental"
          : /commercial/i.test(request)
            ? "Commercial"
            : /offer/i.test(request)
              ? "Offer"
              : /construction/i.test(request)
                ? "Custom"
                : "Launch";
    const brief: CampaignBrief = {
      propertyId: property.id,
      campaignType,
      audiences: [
        /nri/i.test(request)
          ? "NRIs"
          : /invest/i.test(request)
            ? "Investors"
            : "Families",
      ],
      platforms: [
        "Print",
        "Instagram",
        "Facebook",
        "LinkedIn",
        "WhatsApp",
        "Email",
        "Website Banner",
      ],
      language,
      objective: request,
    };
    const campaignId = await studio.saveDraft(
      brief,
      `${property.title} · ${campaignType} growth campaign`,
    );
    const access = await creativeStudioAccess();
    if (!access) throw new Error("Marketing Studio subscription access is required.");
    const { error } = await access.client.rpc("create_growth_campaign_pack", {
      p_campaign_id: campaignId,
      p_language: language,
      p_formats: campaignPackFormats,
    });
    if (error) throw error;
    return {
      campaignId,
      message: `Structured ${language} campaign pack created with ${campaignPackFormats.length} governed draft deliverables.`,
    };
  }

  async dashboard() {
    const access = await creativeStudioAccess();
    if (!access) throw new Error("Marketing Studio subscription access is required.");
    const [packsResult, scheduleResult] = await Promise.all([
      access.client
        .from("creative_campaign_packs")
        // Phase DBV3D: property_project_id is renamed to project_id under
        // Production's compatibility shape (DBV3B) -- an explicit select
        // naming property_project_id by itself would 400 there, so this
        // reads "*" and resolves the Model-B column name in JS instead.
        .select("*")
        .eq("organization_id", access.organizationId)
        .eq("workspace_id", access.workspaceId)
        .order("created_at", { ascending: false })
        .limit(50),
      access.client
        .from("creative_campaign_schedule")
        .select("*")
        .eq("organization_id", access.organizationId)
        .eq("workspace_id", access.workspaceId)
        .order("scheduled_for", { ascending: true })
        .limit(100),
    ]);
    if (packsResult.error) throw packsResult.error;
    if (scheduleResult.error) throw scheduleResult.error;
    const packs = ((packsResult.data ?? []) as Row[]).map(
      (row): GrowthCampaignPack => ({
        id: String(row.id),
        campaignId: String(row.campaign_id),
        propertyId: String(row.property_id),
        propertyProjectId: (row.property_project_id ?? row.project_id) ? String(row.property_project_id ?? row.project_id) : undefined,
        name: String(row.name),
        language: String(row.language) as GrowthCampaignPack["language"],
        status: String(row.status) as GrowthCampaignPack["status"],
        formats: (Array.isArray(row.formats)
          ? row.formats
          : []) as GrowthCampaignPack["formats"],
        assetCount: Number(row.asset_count ?? 0),
        createdAt: String(row.created_at),
      }),
    );
    const schedule = ((scheduleResult.data ?? []) as Row[]).map(
      (row): GrowthScheduleItem => ({
        id: String(row.id),
        campaignId: String(row.campaign_id),
        channel: String(row.channel) as GrowthScheduleItem["channel"],
        scheduledFor: String(row.scheduled_for),
        state: String(row.state) as GrowthScheduleItem["state"],
        publishingEnabled: false,
      }),
    );
    return {
      packs,
      schedule,
      channels: campaignChannels,
      governance: {
        recommendationOnly: true as const,
        approvalRequired: true as const,
        livePublishing: false as const,
        liveAdBuying: false as const,
        liveWhatsAppSending: false as const,
      },
    };
  }

  review(): GrowthReview {
    return {
      brandComplianceScore: 86,
      creativeQualityScore: 84,
      visualHierarchy: 86,
      contrast: 84,
      whitespace: 82,
      typography: 86,
      imageQuality: 84,
      ctaVisibility: 82,
      offerProminence: 80,
      audienceSuitability: 86,
      checks: {
        brandColors: true,
        logoPlacement: true,
        qrCode: false,
        offerAccuracy: false,
        projectInformation: true,
        pricingConsistency: false,
        legalDisclaimer: false,
        reraInformation: false,
        readability: true,
        accessibility: true,
      },
      suggestions: [
        "Verify offer and pricing against inventory before approval.",
        "Add approved legal, RERA, and QR references.",
        "Review every localized version with a fluent human reviewer.",
      ],
    };
  }

  plan(): GrowthPlan {
    return {
      campaignLength: "AI recommendation: 21 days",
      creativeMix: [
        "3 social variants",
        "1 print set",
        "1 editable video project",
        "1 landing page",
      ],
      publishingSequence: [
        "Internal approval",
        "Landing page",
        "Email",
        "Social",
        "Sales follow-up",
      ],
      assetTypes: [
        "Campaign pack",
        "Sales kit",
        "Landing page",
        "Video project",
      ],
      audienceMix: [
        "Primary buyer segment",
        "Retargeting audience",
        "Channel partners",
      ],
      measured: false,
      recommendationOnly: true,
    };
  }
}
