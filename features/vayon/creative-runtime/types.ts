export type CreativeProviderType =
  | "Image"
  | "Video"
  | "Logo"
  | "Editing"
  | "Upscaling"
  | "Background Removal"
  | "Voice"
  | "Presentation"
  | "Document"
  | "Website";
export type CreativeProviderStatus =
  "Available" | "Unavailable" | "Disabled" | "Maintenance" | "Unknown";
export type CreativeCapability =
  | "generate_images"
  | "edit_images"
  | "generate_video"
  | "create_logos"
  | "upscale"
  | "remove_background"
  | "replace_background"
  | "variations"
  | "inpaint"
  | "outpaint"
  | "mockups"
  | "text_replacement"
  | "vector"
  | "transparency";
export interface CreativeProviderDescriptor {
  readonly id: string;
  readonly displayName: string;
  readonly providerType: readonly CreativeProviderType[];
  readonly status: CreativeProviderStatus;
  readonly supportedCapabilities: readonly CreativeCapability[];
  readonly qualityTier: "standard" | "premium" | "unknown";
  readonly speedTier: "fast" | "balanced" | "quality" | "unknown";
  readonly costTier: "low" | "medium" | "high" | "unknown";
  readonly maxResolution: string | null;
  readonly supportedAspectRatios: readonly string[];
  readonly supportsEditing: boolean;
  readonly supportsGeneration: boolean;
  readonly supportsVideo: boolean;
  readonly supportsVector: boolean;
  readonly supportsTransparency: boolean;
  readonly supportsUpscaling: boolean;
  readonly supportsBackgroundRemoval: boolean;
  readonly supportsInpainting: boolean;
  readonly supportsOutpainting: boolean;
  readonly supportsLogoGeneration: boolean;
  readonly supportsMockups: boolean;
  readonly supportsTextReplacement: boolean;
}
export interface CreativeRuntimeRequest {
  readonly id: string;
  readonly prompt: string;
  readonly workspaceId: string;
  readonly projectId: string | null;
  readonly brandId: string | null;
  readonly campaignId: string | null;
  readonly targetAssetId: string | null;
  readonly imageType: string | null;
  readonly style: string | null;
  readonly aspectRatio: string;
  readonly outputCount: number;
  readonly language: string;
  readonly quality: "standard" | "premium";
  readonly priority: "low" | "normal" | "high";
  readonly requiredCapability: CreativeCapability;
  readonly requestedBy:
    | "Creative Director"
    | "Image Studio"
    | "Campaign Studio"
    | "Brand Studio"
    | "Video Studio"
    | "Document Studio";
}
export interface RoutingDecision {
  readonly requestId: string;
  readonly state: "routed" | "unavailable";
  readonly selectedProviderId: string | null;
  readonly fallbackChain: readonly string[];
  readonly reasons: readonly string[];
  readonly evaluatedAt: string;
}
export type GenerationJobState =
  | "Queued"
  | "Running"
  | "Completed"
  | "Failed"
  | "Cancelled"
  | "WaitingApproval";
export interface GenerationJob {
  readonly id: string;
  readonly request: CreativeRuntimeRequest;
  readonly state: GenerationJobState;
  readonly providerId: string | null;
  readonly latencyMs: number | null;
  readonly retries: number;
  readonly costEstimate: number | null;
  readonly resolution: string | null;
  readonly aspectRatio: string;
  readonly failureReason: string | null;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface CreativeAssetOutput {
  readonly id: string;
  readonly workspaceId: string;
  readonly projectId: string | null;
  readonly campaignId: string | null;
  readonly brandId: string | null;
  readonly creativeDirectorTaskId: string | null;
  readonly assetLibraryId: string | null;
  readonly providerId: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
}
export interface QualityReview {
  readonly brandConsistency: "pass" | "review" | "unavailable";
  readonly assetCompleteness: "pass" | "review";
  readonly promptQuality: "pass" | "review";
  readonly metadataCompleteness: "pass" | "review";
  readonly providerResponse: "pass" | "review" | "unavailable";
  readonly automatedJudgement: false;
  readonly reasons: readonly string[];
}
export interface CreativeRuntimeSnapshot {
  readonly providers: readonly CreativeProviderDescriptor[];
  readonly capabilities: Readonly<Record<CreativeCapability, boolean>>;
  readonly health: "Unavailable";
  readonly routingDecisions: readonly RoutingDecision[];
  readonly jobs: readonly GenerationJob[];
  readonly registeredAdapters: 0;
  readonly liveProviders: 0;
  readonly generatedAt: string;
}
