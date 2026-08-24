import type { CreativeProviderDescriptor } from "./types";
const base = {
  status: "Unavailable",
  qualityTier: "unknown",
  speedTier: "unknown",
  costTier: "unknown",
  maxResolution: null,
  supportedAspectRatios: [],
  supportsEditing: false,
  supportsGeneration: false,
  supportsVideo: false,
  supportsVector: false,
  supportsTransparency: false,
  supportsUpscaling: false,
  supportsBackgroundRemoval: false,
  supportsInpainting: false,
  supportsOutpainting: false,
  supportsLogoGeneration: false,
  supportsMockups: false,
  supportsTextReplacement: false,
} as const;
export const creativeProviderRegistry: readonly CreativeProviderDescriptor[] = [
  {
    ...base,
    id: "future-openai",
    displayName: "OpenAI (not connected)",
    providerType: ["Image", "Editing"],
    supportedCapabilities: [],
  },
  {
    ...base,
    id: "future-adobe",
    displayName: "Adobe (not connected)",
    providerType: ["Image", "Editing"],
    supportedCapabilities: [],
  },
  {
    ...base,
    id: "future-google",
    displayName: "Google (not connected)",
    providerType: ["Image", "Video"],
    supportedCapabilities: [],
  },
  {
    ...base,
    id: "future-stability",
    displayName: "Stability (not connected)",
    providerType: ["Image", "Editing"],
    supportedCapabilities: [],
  },
];
export class CreativeProviderRegistry {
  list() {
    return creativeProviderRegistry;
  }
  get(id: string) {
    return (
      creativeProviderRegistry.find((provider) => provider.id === id) ?? null
    );
  }
  available() {
    return creativeProviderRegistry.filter(
      (provider) => provider.status === "Available",
    );
  }
  forCapability(
    capability: CreativeProviderDescriptor["supportedCapabilities"][number],
  ) {
    return this.available().filter((provider) =>
      provider.supportedCapabilities.includes(capability),
    );
  }
}
