import "server-only";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { EnterpriseOnboardingService } from "@/features/onboarding/services/enterprise-onboarding.service";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
import { CampaignStudioService } from "@/features/vayon/campaign-studio/service";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import type { BusinessLaunchProject, BusinessLaunchSnapshot } from "./types";
export class BusinessLaunchService {
  async snapshot(): Promise<BusinessLaunchSnapshot> {
    await requireWorkspacePermission("creative_studio", "view");
    const [session, brandService, campaignService, creativeService] =
      await Promise.all([
        new EnterpriseOnboardingService().session(),
        BrandStudioService.production(),
        CampaignStudioService.production(),
        CreativeStudioService.production(),
      ]);
    const [brandData, campaignData, creativeData] = await Promise.all([
      brandService?.snapshot() ?? null,
      campaignService?.snapshot() ?? null,
      creativeService?.snapshot() ?? null,
    ]);
    const candidate = session?.configuration?.businessLaunch;
    const project =
      candidate && typeof candidate === "object"
        ? (candidate as BusinessLaunchProject)
        : null;
    return {
      project,
      brands:
        brandData?.brands.map((x) => ({
          id: x.id,
          name: x.name,
          score: brandData.consistency[x.id]?.score ?? 0,
        })) ?? [],
      campaigns: campaignData?.campaigns.length ?? 0,
      existingAssets: creativeData?.assets.length ?? 0,
      executionAvailable: Boolean(creativeService),
      systems: [
        "Brand Studio",
        "Campaign Studio",
        "Creative Director",
        "Document Studio",
        "Image Studio",
        "Video Studio",
        "CRM",
        "AI Workforce",
        "Project System",
      ],
    };
  }
}
