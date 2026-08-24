import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import type { DocumentStudioSnapshot } from "./types";
export class DocumentStudioService {
  private constructor(private creative: CreativeStudioService) {}
  static async production() {
    await requireWorkspacePermission("creative_studio", "view");
    const creative = await CreativeStudioService.production();
    return creative ? new DocumentStudioService(creative) : null;
  }
  async snapshot(): Promise<DocumentStudioSnapshot> {
    const source = await this.creative.snapshot();
    return {
      brands: source.brandKits.map(({ id, name }) => ({ id, name })),
      campaigns: source.campaigns.map(({ id, name }) => ({ id, name })),
      projects: [
        ...new Map(
          source.campaigns.map((item) => [
            item.projectId,
            { id: item.projectId, name: item.projectName },
          ]),
        ).values(),
      ],
      documents: [],
      executionStatus: "WaitingProvider",
      exports: ["PDF", "DOCX", "PPTX", "HTML", "Editable Project"],
      aiEdits: [
        "Rewrite",
        "Expand",
        "Shorten",
        "Summarize",
        "Professional",
        "Luxury",
        "Technical",
        "Friendly",
        "Translate",
        "Improve grammar",
        "Generate FAQ",
        "Generate CTA",
        "Generate Testimonials",
      ],
      pipeline: [
        "Creative Director",
        "Copywriter",
        "Document Designer",
        "Graphic Designer",
        "Brand Reviewer",
        "Publisher",
      ],
    };
  }
}
