import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
import { campaignTemplates } from "./catalog";
import { creativeDepartments } from "./creative-director";
import type { CampaignStudioSnapshot } from "./types";
export class CampaignStudioService {
  private constructor(
    private creative: CreativeStudioService,
    private brands: BrandStudioService,
  ) {}
  static async production() {
    const [creative, brands] = await Promise.all([
      CreativeStudioService.production(),
      BrandStudioService.production(),
    ]);
    return creative && brands
      ? new CampaignStudioService(creative, brands)
      : null;
  }
  async snapshot(): Promise<CampaignStudioSnapshot> {
    const [creative, brandData] = await Promise.all([
      this.creative.snapshot(),
      this.brands.snapshot(),
    ]);
    return {
      campaigns: creative.campaigns.map((item) => ({
        id: item.id,
        name: item.name,
        state: item.status,
        updatedAt: item.updatedAt,
        assets: creative.assets.filter((asset) => asset.campaignId === item.id)
          .length,
      })),
      brands: brandData.brands.map((item) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        score: brandData.consistency[item.id]?.score ?? 0,
      })),
      projects: [
        ...new Set(creative.campaigns.map((item) => item.projectName)),
      ],
      templates: campaignTemplates,
      recommendations: [
        "Complete Brand Studio before campaign production.",
        "Define an audience and objective before selecting deliverables.",
        "Use approval gates before any future publishing.",
      ],
      exports: [
        "Campaign ZIP",
        "Creative Package",
        "Brand Package",
        "Presentation Package",
        "Marketing Package",
      ],
      lifecycle: [
        "Draft",
        "Review",
        "Approved",
        "Scheduled",
        "Published",
        "Archived",
      ],
      departments: creativeDepartments,
      analytics: "placeholder",
    };
  }
}
