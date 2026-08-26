export const strategyTypes = ["Product Launch", "Feature Launch", "Educational Campaign", "Thought Leadership", "Founder Story", "Customer Story", "Case Study", "Recruitment", "Community Growth", "Referral Campaign", "Investor Update", "Product Comparison", "Webinar", "Podcast", "Conference", "Partnership"] as const;
export const brandVoices = ["Professional", "Visionary", "Friendly", "Luxury", "Enterprise", "Startup", "Educational"] as const;
export const creativeAssetTypes = ["LinkedIn Carousel", "Instagram Reel", "YouTube Thumbnail", "Blog Hero", "Email Header", "Landing Page Hero", "Presentation Cover", "Ad Creative", "Banner"] as const;
export const reviewStatuses = ["Draft", "Review", "Approved", "Rejected", "Archived"] as const;
export type StrategyType = (typeof strategyTypes)[number];
export type BrandVoice = (typeof brandVoices)[number];
export type ReviewStatus = (typeof reviewStatuses)[number];

export interface MarketingEvidence {
  readonly campaigns: readonly string[];
  readonly content: readonly string[];
  readonly launches: readonly string[];
  readonly communitySignals: readonly string[];
  readonly brandRequirements: readonly string[];
  readonly investorMilestones: readonly string[];
}

export const unavailableMarketingEvidence: MarketingEvidence = { campaigns: [], content: [], launches: [], communitySignals: [], brandRequirements: [], investorMilestones: [] };

export type Readiness = { area: string; status: "Needs evidence" | "Ready for planning"; recommendation: string; missingRequirements: readonly string[]; nextAction: string };

export function marketingReadiness(evidence: MarketingEvidence): readonly Readiness[] {
  return [
    readiness("Brand Consistency", evidence.brandRequirements.length > 0, "Document an approved brand voice and core message.", ["Approved brand voice", "Core message"], "Define brand voice"),
    readiness("Publishing Readiness", false, "Keep every item in review until a publishing provider is intentionally connected.", ["Connected publishing provider", "Final approval"], "Prepare approval-ready drafts"),
    readiness("Campaign Readiness", evidence.campaigns.length > 0, "Define one campaign goal, audience, message, and approval owner.", ["Campaign brief", "Approval owner"], "Plan campaign"),
    readiness("Community Readiness", evidence.communitySignals.length > 0, "Choose one community initiative and assign an owner.", ["Community signal", "Initiative owner"], "Plan community activity"),
    readiness("Content Readiness", evidence.content.length > 0, "Prepare the first content brief with purpose and audience.", ["Content brief", "Creative requirements"], "Prepare content brief"),
    readiness("SEO Readiness", false, "Connect governed search evidence before prioritizing keywords.", ["Search performance source", "Approved target topics"], "Review SEO evidence"),
    readiness("PR Readiness", false, "Prepare an announcement angle and review owner.", ["Announcement brief", "Media owner"], "Draft announcement"),
    readiness("Referral Readiness", false, "Define audience, incentive constraints, and approval requirements.", ["Referral audience", "Approved reward policy"], "Design referral brief"),
    readiness("Investor Communication", evidence.investorMilestones.length > 0, "Prepare a monthly update using verified milestones only.", ["Verified milestones", "Risk summary"], "Prepare investor update"),
  ];
}

function readiness(area: string, ready: boolean, recommendation: string, missingRequirements: readonly string[], nextAction: string): Readiness {
  return { area, status: ready ? "Ready for planning" : "Needs evidence", recommendation, missingRequirements: ready ? [] : missingRequirements, nextAction };
}

export interface CampaignPlan {
  readonly strategy: StrategyType;
  readonly goal: string;
  readonly targetAudience: string;
  readonly primaryMessage: string;
  readonly supportingMessages: readonly string[];
  readonly cta: string;
  readonly channels: readonly string[];
  readonly creativeRequirements: readonly string[];
  readonly timeline: readonly string[];
  readonly successCriteria: string;
  readonly dependencies: readonly string[];
  readonly approvals: readonly string[];
  readonly status: ReviewStatus;
  readonly estimatedEffort: string;
}

export function prepareCampaignPlan(strategy: StrategyType, goal: string, audience: string, brandVoice: BrandVoice): CampaignPlan {
  return { strategy, goal, targetAudience: audience, primaryMessage: `${strategy}: ${goal}`, supportingMessages: [`Why this matters to ${audience}`, `How the proposed outcome supports the campaign goal`], cta: "Define one measurable, user-approved next step", channels: ["Select channels after audience review"], creativeRequirements: [`Use the ${brandVoice} brand voice`, "Prepare channel-specific assets in Creative Studio"], timeline: ["Planning", "Review", "Creative", "Approval", "Launch", "Completed"], successCriteria: "Define criteria only after a governed evidence source is selected", dependencies: ["Audience approval", "Message approval", "Creative brief approval"], approvals: ["Campaign owner", "Brand reviewer", "Final publisher"], status: "Draft", estimatedEffort: "45 minutes" };
}

export const communityRecommendations = ["Host Webinar", "Publish Tutorial", "Launch AMA", "Feature Customer Story", "Collect Testimonials", "Create Template"] as const;
export const investorUpdateSections = ["Progress", "Product", "Customers", "Growth", "Upcoming Milestones", "Risks", "Fundraising"] as const;
