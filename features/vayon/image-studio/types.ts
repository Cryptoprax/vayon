import type { CreativeAsset } from "@/features/vayon/creative-studio/domain";
export type ImageType =
  | "Product Image"
  | "Hero Image"
  | "Lifestyle Image"
  | "Team Photo"
  | "Office Image"
  | "Product Mockup"
  | "Marketing Image"
  | "Photography"
  | "Illustration"
  | "Vector"
  | "Icon"
  | "Logo Concept"
  | "Product Render"
  | "Architecture"
  | "Interior"
  | "Landscape"
  | "Portrait"
  | "Background"
  | "Texture"
  | "Pattern"
  | "Mockup";
export type ImageStyle =
  | "Luxury"
  | "Corporate"
  | "Minimal"
  | "Modern"
  | "Realistic"
  | "Cinematic"
  | "Editorial"
  | "Flat"
  | "3D"
  | "Photorealistic"
  | "Watercolor"
  | "Sketch"
  | "Anime"
  | "Custom";
export type EditTool =
  | "Crop"
  | "Resize"
  | "Rotate"
  | "Flip"
  | "Layers"
  | "History"
  | "Undo"
  | "Redo"
  | "Duplicate"
  | "Versioning";
export type AiEditOperation =
  | "Background removal"
  | "Background replacement"
  | "Crop"
  | "Resize"
  | "Object removal"
  | "Object insertion"
  | "Object addition"
  | "Expand canvas"
  | "Inpainting"
  | "Outpainting"
  | "Upscaling"
  | "Relighting"
  | "Colour replacement"
  | "Shadow adjustment"
  | "Reflection removal"
  | "Text replacement"
  | "Smart erase"
  | "Magic selection"
  | "Variations";
export type ExportFormat =
  "PNG" | "JPG" | "SVG" | "WEBP" | "TIFF" | "PSD" | "PDF";
export interface ImageGenerationRequest {
  readonly prompt: string;
  readonly type: ImageType;
  readonly style: ImageStyle;
  readonly brandId: string | null;
  readonly projectId: string | null;
  readonly campaignId: string | null;
  readonly brandMode: boolean;
}
export interface ImageProviderCapability {
  readonly provider: "OpenAI" | "Adobe" | "Google" | "Future engines";
  readonly connected: boolean;
  readonly operations: readonly ("generate" | "edit")[];
}
export interface ImageInspector {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly brand: string;
  readonly project: string;
  readonly creator: string;
  readonly created: string;
  readonly resolution: "Unavailable";
  readonly aspectRatio: "Unavailable";
  readonly colourPalette: readonly string[];
  readonly usage: readonly string[];
  readonly asset: CreativeAsset;
}
export interface ImageStudioSnapshot {
  readonly images: readonly ImageInspector[];
  readonly brandAssets: readonly ImageInspector[];
  readonly aiImages: readonly ImageInspector[];
  readonly uploadedImages: readonly ImageInspector[];
  readonly sharedImages: readonly ImageInspector[];
  readonly projects: readonly { readonly id: string; readonly name: string }[];
  readonly campaigns: readonly { readonly id: string; readonly name: string }[];
  readonly brand: {
    readonly id: string;
    readonly name: string;
    readonly colors: readonly string[];
    readonly tone: string;
    readonly logoPath: string | null;
    readonly typography: readonly string[];
  } | null;
  readonly providerCapabilities: readonly ImageProviderCapability[];
  readonly editTools: readonly EditTool[];
  readonly aiOperations: readonly AiEditOperation[];
  readonly exports: readonly ExportFormat[];
  readonly collaboration: readonly string[];
  readonly providerState: "available" | "unavailable";
  readonly generationEnabled: boolean;
}
export interface ImageExecutionSubmission {
  readonly status:
    | "WaitingProvider"
    | "WaitingApproval"
    | "Completed"
    | "Failed"
    | "Cancelled";
  readonly assetId: string | null;
  readonly storagePath: string | null;
  readonly provider: string | null;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly latencyMs: number | null;
  readonly estimatedCost: number | null;
}
