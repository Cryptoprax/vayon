import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
import type { ImageInspector, ImageStudioSnapshot } from "./types";
import { OpenAIImageRuntimeAdapter } from "@/features/vayon/creative-providers/openai-image.adapter";
const editTools = [
    "Crop",
    "Resize",
    "Rotate",
    "Flip",
    "Layers",
    "History",
    "Undo",
    "Redo",
    "Duplicate",
    "Versioning",
  ] as const,
  aiOperations = [
    "Background removal",
    "Background replacement",
    "Crop",
    "Resize",
    "Object removal",
    "Object insertion",
    "Object addition",
    "Expand canvas",
    "Inpainting",
    "Outpainting",
    "Upscaling",
    "Relighting",
    "Colour replacement",
    "Shadow adjustment",
    "Reflection removal",
    "Text replacement",
    "Smart erase",
    "Magic selection",
    "Variations",
  ] as const;
export class ImageStudioService {
  private constructor(
    private creative: CreativeStudioService,
    private brand: BrandStudioService,
  ) {}
  static async production() {
    const [creative, brand] = await Promise.all([
      CreativeStudioService.production(),
      BrandStudioService.production(),
    ]);
    return creative && brand ? new ImageStudioService(creative, brand) : null;
  }
  async snapshot(): Promise<ImageStudioSnapshot> {
    const [creative, brands] = await Promise.all([
        this.creative.snapshot(),
        this.brand.snapshot(),
      ]),
      active =
        brands.brands.find((item) => item.id === brands.activeBrandId) ??
        brands.brands[0],
      campaigns = new Map(creative.campaigns.map((item) => [item.id, item])),
      health = await new OpenAIImageRuntimeAdapter().health(),
      images: ImageInspector[] = creative.assets
        .filter((asset) =>
          ["image", "design", "social", "logo", "flyer", "brochure"].some(
            (value) => asset.category.toLowerCase().includes(value),
          ),
        )
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          prompt: asset.prompt,
          brand: active?.name ?? "Unassigned",
          project: campaigns.get(asset.campaignId)?.name ?? "Unassigned",
          creator: asset.creator,
          created: asset.generatedAt,
          resolution: "Unavailable",
          aspectRatio: "Unavailable",
          colourPalette: active?.kit.colors ?? [],
          usage: asset.exports,
          asset,
        }));
    return {
      images,
      brandAssets: images.filter((item) =>
        item.asset.category.toLowerCase().includes("brand"),
      ),
      aiImages: images.filter((item) => Boolean(item.asset.aiEmployee)),
      uploadedImages: [],
      sharedImages: [],
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
            colors: active.kit.colors,
            tone: active.kit.tone,
            logoPath: active.kit.logoPath ?? null,
            typography: active.kit.typography,
          }
        : null,
      providerCapabilities: ["OpenAI", "Adobe", "Google", "Future engines"].map(
        (provider) => ({
          provider: provider as
            "OpenAI" | "Adobe" | "Google" | "Future engines",
          connected: provider === "OpenAI" && health.state === "available",
          operations: ["generate", "edit"],
        }),
      ),
      editTools,
      aiOperations,
      exports: ["PNG", "JPG", "SVG", "WEBP", "TIFF", "PSD", "PDF"],
      collaboration: [
        "Comments",
        "Approvals",
        "Version history",
        "Assignments",
        "Activity timeline",
      ],
      providerState: health.state === "available" ? "available" : "unavailable",
      generationEnabled: health.state === "available",
    };
  }
}
