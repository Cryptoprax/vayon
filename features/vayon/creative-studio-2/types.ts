import type { CreativeAsset, CreativeBrandKit, CreativeCampaign } from "@/features/vayon/creative-studio/domain";

export type CreativeModuleId = "brand" | "images" | "marketing" | "presentations" | "documents" | "videos" | "websites" | "assets" | "templates" | "projects";
export type ProjectCapability = "autosave" | "versions" | "duplicate" | "archive" | "restore" | "share" | "export";
export type ExportFormat = "PNG" | "JPG" | "SVG" | "PDF" | "PPTX" | "DOCX" | "HTML" | "MP4";

export interface CreativeModule { readonly id: CreativeModuleId; readonly name: string; readonly outcome: string; readonly availability: "available" | "foundation" }
export interface CreativeProject { readonly id: string; readonly name: string; readonly status: CreativeCampaign["status"]; readonly updatedAt: string; readonly assetCount: number; readonly categories: readonly string[] }
export interface CreativeStudio2Snapshot {
  readonly projects: readonly CreativeProject[];
  readonly assets: readonly CreativeAsset[];
  readonly brandKits: readonly CreativeBrandKit[];
  readonly modules: readonly CreativeModule[];
  readonly projectCapabilities: readonly ProjectCapability[];
  readonly exportFormats: readonly ExportFormat[];
  readonly governance: { readonly tenantScoped: true; readonly providerConnected: false; readonly generationEnabled: false; readonly draftOnly: true };
}
