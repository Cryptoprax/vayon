import type { BrandRecord } from "./types";
export interface CreativeBrandDefaults {
  readonly brandId: string;
  readonly colors: BrandRecord["profile"]["colors"];
  readonly typography: readonly string[];
  readonly tone: string;
  readonly photographyStyle: string;
  readonly iconStyle: string;
  readonly illustrationStyle: string;
  readonly motionStyle: string;
  readonly ctaStyle: string;
  readonly legalDisclaimers: readonly string[];
}
export function resolveCreativeBrandDefaults(
  brand: BrandRecord,
): CreativeBrandDefaults {
  return {
    brandId: brand.id,
    colors: brand.profile.colors,
    typography: brand.profile.typography,
    tone: brand.profile.toneOfVoice,
    photographyStyle: brand.profile.photographyStyle,
    iconStyle: brand.profile.iconStyle,
    illustrationStyle: brand.profile.illustrationStyle,
    motionStyle: brand.profile.motionStyle,
    ctaStyle: brand.profile.ctaStyle,
    legalDisclaimers: brand.profile.legalDisclaimers,
  };
}
export const brandDefaultConsumers = [
  "Marketing Studio",
  "Presentation Studio",
  "Video Studio",
  "Website Studio",
  "Image Studio",
] as const;
