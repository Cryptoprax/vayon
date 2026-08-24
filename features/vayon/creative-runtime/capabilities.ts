import type { CreativeCapability, CreativeProviderDescriptor } from "./types";
export const creativeCapabilityQueries = {
  CanGenerateImages: "generate_images",
  CanEditImages: "edit_images",
  CanGenerateVideo: "generate_video",
  CanCreateLogos: "create_logos",
  CanUpscale: "upscale",
  CanRemoveBackground: "remove_background",
} as const satisfies Record<string, CreativeCapability>;
export function buildCapabilityMatrix(
  providers: readonly CreativeProviderDescriptor[],
): Readonly<Record<CreativeCapability, boolean>> {
  const keys: CreativeCapability[] = [
    "generate_images",
    "edit_images",
    "generate_video",
    "create_logos",
    "upscale",
    "remove_background",
    "replace_background",
    "variations",
    "inpaint",
    "outpaint",
    "mockups",
    "text_replacement",
    "vector",
    "transparency",
  ];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      providers.some(
        (provider) =>
          provider.status === "Available" &&
          provider.supportedCapabilities.includes(key),
      ),
    ]),
  ) as Record<CreativeCapability, boolean>;
}
export function hasCreativeCapability(
  matrix: Readonly<Record<CreativeCapability, boolean>>,
  query: keyof typeof creativeCapabilityQueries,
) {
  return matrix[creativeCapabilityQueries[query]];
}
