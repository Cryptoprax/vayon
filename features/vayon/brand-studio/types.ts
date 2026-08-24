import type { CreativeBrandKit } from "@/features/vayon/creative-studio/domain";

export type BusinessType =
  | "Startup"
  | "SMB"
  | "Enterprise"
  | "Agency"
  | "Manufacturer"
  | "Healthcare"
  | "Education"
  | "Construction"
  | "Solar"
  | "Real Estate"
  | "Hospitality"
  | "Other";
export type Audience =
  | "B2B"
  | "B2C"
  | "Government"
  | "Industrial"
  | "Residential"
  | "Investors"
  | "Distributors"
  | "Custom";
export type Personality =
  | "Luxury"
  | "Modern"
  | "Corporate"
  | "Premium"
  | "Eco-Friendly"
  | "Bold"
  | "Minimal"
  | "Elegant"
  | "Innovative"
  | "Friendly"
  | "Professional"
  | "Custom";
export type LogoPreference =
  "Wordmark" | "Icon" | "Combination" | "Monogram" | "Emblem" | "Abstract";
export type PhotographyStyle =
  | "Corporate"
  | "Lifestyle"
  | "Product"
  | "Architectural"
  | "Industrial"
  | "Minimal"
  | "Luxury"
  | "Documentary";
export interface BrandProfile {
  readonly companyName: string;
  readonly industry: string;
  readonly website: string;
  readonly country: string;
  readonly targetMarket: string;
  readonly businessType: BusinessType;
  readonly audiences: readonly Audience[];
  readonly personality: Personality;
  readonly colorStrategy: "recommend" | "manual";
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly typography: string;
  };
  readonly logoPreference: LogoPreference;
  readonly photographyStyle: PhotographyStyle;
  readonly values: readonly string[];
  readonly mission: string;
  readonly vision: string;
  readonly toneOfVoice: string;
  readonly writingStyle: string;
  readonly typography: readonly string[];
  readonly iconStyle: string;
  readonly illustrationStyle: string;
  readonly motionStyle: string;
  readonly ctaStyle: string;
  readonly legalDisclaimers: readonly string[];
  readonly keywords: readonly string[];
  readonly dos: readonly string[];
  readonly donts: readonly string[];
}
export interface BrandRecord {
  readonly id: string;
  readonly name: string;
  readonly status: "default" | "active" | "archived";
  readonly kit: CreativeBrandKit;
  readonly profile: BrandProfile;
}
export interface BrandConsistencyResult {
  readonly score: number;
  readonly missingAssets: readonly string[];
  readonly outdatedAssets: readonly string[];
  readonly recommendations: readonly string[];
}
export interface BrandStudioSnapshot {
  readonly brands: readonly BrandRecord[];
  readonly activeBrandId: string | null;
  readonly consistency: Readonly<Record<string, BrandConsistencyResult>>;
  readonly consumers: readonly string[];
  readonly exports: readonly string[];
  readonly persistence: "existing-brand-kit";
  readonly providerConnected: false;
}
