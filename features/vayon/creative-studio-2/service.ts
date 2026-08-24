import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import type { CreativeModule, CreativeStudio2Snapshot } from "./types";

const modules: readonly CreativeModule[] = [
  { id: "brand", name: "Brand Studio", outcome: "Keep every creative unmistakably on brand.", availability: "available" },
  { id: "marketing", name: "Marketing Studio", outcome: "Turn business goals into governed campaigns.", availability: "available" },
  { id: "presentations", name: "Presentation Studio", outcome: "Shape clear stories for customers and stakeholders.", availability: "foundation" },
  { id: "images", name: "Image Studio", outcome: "Plan and organize premium visual concepts.", availability: "foundation" },
  { id: "videos", name: "Video Studio", outcome: "Prepare storyboards and video-ready campaigns.", availability: "foundation" },
  { id: "websites", name: "Website Studio", outcome: "Create conversion-focused landing page projects.", availability: "foundation" },
  { id: "documents", name: "Document Studio", outcome: "Build polished brochures, proposals, and reports.", availability: "foundation" },
  { id: "assets", name: "Asset Library", outcome: "Find governed brand, uploaded, and generated assets.", availability: "available" },
  { id: "templates", name: "Template Marketplace", outcome: "Start faster from reusable creative systems.", availability: "available" },
  { id: "projects", name: "Creative Projects", outcome: "Keep every deliverable and version together.", availability: "available" },
];

export class CreativeStudio2Service {
  private constructor(private readonly studio: CreativeStudioService) {}
  static async production() { const studio = await CreativeStudioService.production(); return studio ? new CreativeStudio2Service(studio) : null; }
  async snapshot(): Promise<CreativeStudio2Snapshot> {
    const source = await this.studio.snapshot();
    return {
      modules,
      projects: source.campaigns.map(campaign => ({ id: campaign.id, name: campaign.name, status: campaign.status, updatedAt: campaign.updatedAt, assetCount: source.assets.filter(asset => asset.campaignId === campaign.id).length, categories: [...new Set(source.assets.filter(asset => asset.campaignId === campaign.id).map(asset => asset.category))] })),
      assets: source.assets,
      brandKits: source.brandKits,
      projectCapabilities: ["autosave", "versions", "duplicate", "archive", "restore", "share", "export"],
      exportFormats: ["PNG", "JPG", "SVG", "PDF", "PPTX", "DOCX", "HTML", "MP4"],
      governance: { tenantScoped: true, providerConnected: false, generationEnabled: false, draftOnly: true },
    };
  }
}
