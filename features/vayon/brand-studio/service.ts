import "server-only";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
import { brandDefaultConsumers } from "./brand-defaults";
import { evaluateBrandConsistency } from "./consistency.engine";
import type { BrandProfile, BrandRecord, BrandStudioSnapshot } from "./types";
const profile = (
  name: string,
  tone: string,
  colors: readonly string[],
  typography: readonly string[],
): BrandProfile => ({
  companyName: name,
  industry: "Not configured",
  website: "",
  country: "",
  targetMarket: "",
  businessType: "Other",
  audiences: [],
  personality: "Professional",
  colorStrategy: "manual",
  colors: {
    primary: colors[0] ?? "",
    secondary: colors[1] ?? "",
    accent: colors[2] ?? "",
    background: colors[3] ?? "",
    typography: colors[4] ?? "",
  },
  logoPreference: "Combination",
  photographyStyle: "Corporate",
  values: [],
  mission: "",
  vision: "",
  toneOfVoice: tone,
  writingStyle: "",
  typography,
  iconStyle: "",
  illustrationStyle: "",
  motionStyle: "",
  ctaStyle: "",
  legalDisclaimers: [],
  keywords: [],
  dos: [],
  donts: [],
});
export class BrandStudioService {
  private constructor(private studio: CreativeStudioService) {}
  static async production() {
    const studio = await CreativeStudioService.production();
    return studio ? new BrandStudioService(studio) : null;
  }
  async snapshot(): Promise<BrandStudioSnapshot> {
    const source = await this.studio.snapshot(),
      brands: BrandRecord[] = source.brandKits.map((kit, index) => ({
        id: kit.id,
        name: kit.name,
        status: index === 0 ? "default" : "active",
        kit,
        profile: profile(
          kit.name,
          kit.tone,
          kit.colors,
          kit.typography.length ? kit.typography : kit.fonts,
        ),
      }));
    return {
      brands,
      activeBrandId: brands[0]?.id ?? null,
      consistency: Object.fromEntries(
        brands.map((brand) => [brand.id, evaluateBrandConsistency(brand)]),
      ),
      consumers: brandDefaultConsumers,
      exports: [
        "Brand Guidelines PDF",
        "Brand Package ZIP",
        "Logo Pack",
        "Colour Tokens",
        "Typography Sheet",
      ],
      persistence: "existing-brand-kit",
      providerConnected: false,
    };
  }
}
