export type CampaignObjective =
  | "Launch Product"
  | "Generate Leads"
  | "Sell Product"
  | "Brand Awareness"
  | "Investor Presentation"
  | "Hiring Campaign"
  | "Franchise Expansion"
  | "Government Tender"
  | "Real Estate Launch"
  | "Solar Campaign"
  | "Healthcare Campaign"
  | "Education Campaign"
  | "Hospitality Campaign"
  | "Retail Promotion"
  | "Custom";
export type CampaignAudience =
  | "B2B"
  | "B2C"
  | "Government"
  | "Industrial"
  | "Residential"
  | "Commercial"
  | "Investors"
  | "Partners"
  | "Distributors"
  | "Custom";
export type CampaignStyle =
  | "Luxury"
  | "Corporate"
  | "Modern"
  | "Minimal"
  | "Eco Friendly"
  | "Premium"
  | "Bold"
  | "Elegant"
  | "Industrial"
  | "Technology"
  | "Healthcare"
  | "Government";
export type CampaignLifecycle =
  "Draft" | "Review" | "Approved" | "Scheduled" | "Published" | "Archived";
export type CreativeDepartment =
  | "Brand Designer"
  | "Graphic Designer"
  | "Presentation Designer"
  | "Copywriter"
  | "Motion Designer"
  | "Video Producer"
  | "Social Media Manager"
  | "Advertising Specialist"
  | "Landing Page Designer"
  | "Email Marketing Specialist";
export interface CampaignBrief {
  readonly name: string;
  readonly description: string;
  readonly industry: string;
  readonly businessType: string;
  readonly targetCountry: string;
  readonly languages: readonly string[];
  readonly objective: CampaignObjective;
  readonly audiences: readonly CampaignAudience[];
  readonly brandIds: readonly string[];
  readonly deliverables: readonly string[];
  readonly style: CampaignStyle;
}
export interface CampaignTask {
  readonly id: string;
  readonly deliverable: string;
  readonly department: CreativeDepartment;
  readonly dependencies: readonly string[];
  readonly approvalRequired: true;
  readonly state: "planned";
}
export interface CampaignBlueprint {
  readonly tasks: readonly CampaignTask[];
  readonly estimatedOutputs: number;
  readonly estimatedCompletionDays: number;
  readonly brandReadiness: number;
  readonly creativeReadiness: number;
  readonly creativeScore: number;
  readonly completeness: number;
  readonly requiredApprovals: readonly string[];
  readonly missingAssets: readonly string[];
  readonly recommendations: readonly string[];
  readonly risks: readonly string[];
  readonly providerState: "unavailable";
  readonly executionEnabled: false;
}
export interface CampaignStudioSnapshot {
  readonly campaigns: readonly {
    readonly id: string;
    readonly name: string;
    readonly state: string;
    readonly updatedAt: string;
    readonly assets: number;
  }[];
  readonly brands: readonly {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly score: number;
  }[];
  readonly projects: readonly string[];
  readonly templates: readonly string[];
  readonly recommendations: readonly string[];
  readonly exports: readonly string[];
  readonly lifecycle: readonly CampaignLifecycle[];
  readonly departments: readonly CreativeDepartment[];
  readonly analytics: "placeholder";
}
