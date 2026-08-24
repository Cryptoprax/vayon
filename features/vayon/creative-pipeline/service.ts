import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import type { PipelineSnapshot, PipelineType } from "./types";
const templates: readonly PipelineType[] = [
  "Brochure",
  "Company Profile",
  "Product Catalogue",
  "Pitch Deck",
  "Proposal",
  "Flyer",
  "Poster",
  "Roll-up Banner",
  "Landing Page",
  "Email Campaign",
  "Social Campaign",
  "Product Datasheet",
  "Case Study",
  "Whitepaper",
  "Press Release",
];
export class CreativePipelineService {
  private constructor(private creative: CreativeStudioService) {}
  static async production() {
    const creative = await CreativeStudioService.production();
    return creative ? new CreativePipelineService(creative) : null;
  }
  async snapshot(): Promise<PipelineSnapshot> {
    const source = await this.creative.snapshot();
    return {
      pipelines: [],
      templates,
      projects: [...new Set(source.campaigns.map((item) => item.projectName))],
      queue: { queued: 0, running: 0, blocked: 0 },
      health: "Ready",
      runtimeStatus: "Unavailable",
      exports: [
        "PDF",
        "PPTX",
        "DOCX",
        "HTML",
        "INDD (future)",
        "Editable Project",
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
