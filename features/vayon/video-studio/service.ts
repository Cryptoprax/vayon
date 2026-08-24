import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
import { OpenAIVideoRuntimeAdapter } from "@/features/vayon/creative-providers/openai-video.adapter";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import {
  videoEditOperations,
  videoOutputs,
  type VideoStudioSnapshot,
} from "./types";
export class VideoStudioService {
  private constructor(
    private creative: CreativeStudioService,
    private brands: BrandStudioService,
  ) {}
  static async production() {
    await requireWorkspacePermission("creative_studio", "view");
    const [creative, brands] = await Promise.all([
      CreativeStudioService.production(),
      BrandStudioService.production(),
    ]);
    return creative && brands ? new VideoStudioService(creative, brands) : null;
  }
  async snapshot(): Promise<VideoStudioSnapshot> {
    const [creative, brands, health] = await Promise.all([
        this.creative.snapshot(),
        this.brands.snapshot(),
        new OpenAIVideoRuntimeAdapter().health(),
      ]),
      active =
        brands.brands.find((item) => item.id === brands.activeBrandId) ??
        brands.brands[0];
    return {
      videos: creative.assets
        .filter((item) => item.category === "video")
        .map((item) => ({
          id: item.id,
          name: item.name,
          projectId: item.projectId,
          campaignId: item.campaignId,
          version: item.version,
          createdAt: item.generatedAt,
        })),
      projects: [
        ...new Map(
          creative.campaigns.map((item) => [
            item.projectId,
            { id: item.projectId, name: item.projectName },
          ]),
        ).values(),
      ],
      campaigns: creative.campaigns.map((item) => ({
        id: item.id,
        name: item.name,
      })),
      brand: active
        ? {
            id: active.id,
            name: active.name,
            colours: active.profile.colors
              ? Object.values(active.profile.colors)
              : [],
            typography: active.profile.typography,
            logo: active.kit.logoPath ?? null,
            visualIdentity: active.profile.personality,
            motionStyle: active.profile.motionStyle,
            voice: active.profile.toneOfVoice,
          }
        : null,
      providerState: health.state === "available" ? "available" : "unavailable",
      providerReason: health.reason,
      outputs: videoOutputs,
      edits: videoEditOperations,
      exports: [
        "MP4",
        "MOV",
        "WEBM",
        "GIF Preview",
        "Storyboard PDF",
        "Subtitle SRT",
      ],
      pipeline: [
        "Video Director",
        "Script Writer",
        "Storyboard Designer",
        "Voice Artist",
        "Motion Designer",
        "Video Editor",
        "Brand Reviewer",
        "Publisher",
      ],
    };
  }
}
