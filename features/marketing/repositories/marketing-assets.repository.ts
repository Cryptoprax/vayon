import type {
  AssetSlug,
  ComparisonPage,
  ComparisonSlug,
  CustomerStory,
  IndustryPage,
  IndustrySlug,
  MarketingAsset,
} from "../contracts/assets";
const industryNames: Record<IndustrySlug, string> = {
  "residential-agencies": "Residential Agencies",
  "commercial-brokerages": "Commercial Brokerages",
  "property-developers": "Real Estate Developers",
  builders: "Builders",
  "luxury-property": "Luxury Property Firms",
  "property-management": "Property Management",
  "channel-partners": "Channel Partner Networks",
  "real-estate-groups": "Large Real Estate Groups",
};
export const industries = Object.entries(industryNames).map(
  ([slug, name]): IndustryPage => ({
    slug: slug as IndustrySlug,
    name,
    description: `Connect ${name.toLowerCase()} leads, properties, conversations, governed AI recommendations, and accountable sales workflows in one real estate platform.`,
    challenges: [
      "Fragmented buyer, seller, and property context",
      "Manual enquiry follow-up and agent handoffs",
      "Limited pipeline and inventory visibility",
    ],
    solutions: [
      "A shared real estate CRM and communication timeline",
      "Specialist property AI advisors with human approval",
      "Workflow orchestration across leads, visits, proposals, and deals",
    ],
    benefits: [
      "Faster response and clearer ownership",
      "Consistent governance across teams",
      "Evidence-backed operational decisions",
    ],
    roi: "Model potential time and revenue impact with the transparent VAYON ROI calculator. Estimates depend on your inputs and are not guarantees.",
    workflows: [
      "New property enquiry qualification",
      "At-risk deal follow-up",
      "Daily real estate sales briefing",
    ],
  }),
);
const comparisonNames: Record<ComparisonSlug, string> = {
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  "zoho-crm": "Zoho CRM",
  pipedrive: "Pipedrive",
  monday: "Monday.com",
};
export const comparisons = Object.entries(comparisonNames).map(
  ([slug, competitor]): ComparisonPage => ({
    slug: slug as ComparisonSlug,
    competitor,
    summary: `Compare VAYON’s governed AI workforce and connected operating model with ${competitor}.`,
    dimensions: [
      {
        label: "Operating model",
        vayon:
          "CRM, communications, workflows, knowledge, and AI share tenant-scoped context.",
        alternative: `Evaluate ${competitor} configuration and integrations for your required operating model.`,
      },
      {
        label: "AI governance",
        vayon:
          "Recommendation-only by default with approvals, attribution, and audit events.",
        alternative: `Confirm ${competitor} governance behavior for each selected AI feature.`,
      },
      {
        label: "Provider architecture",
        vayon:
          "Repository → Service → Provider boundaries keep providers swappable.",
        alternative: `Review ${competitor} extension and provider boundaries.`,
      },
      {
        label: "Demo evidence",
        vayon:
          "Read-only, isolated Prime Properties Realty demo workspace with deterministic sample data.",
        alternative:
          "Validate using the vendor’s current product documentation and trial.",
      },
    ],
    disclaimer: `Comparison reflects VAYON architecture, not an independently verified assessment of ${competitor}. Competitor capabilities and pricing may change; verify them directly.`,
  }),
);
export const marketingAssets: readonly MarketingAsset[] = [
  ...[
    "One-pager",
    "Executive Summary",
    "Platform Overview",
    "AI Workforce Overview",
    "Enterprise Security Overview",
    "Workflow Overview",
  ].map((title, index) => ({
    slug: [
      "one-pager",
      "executive-summary",
      "platform-overview",
      "ai-workforce-overview",
      "enterprise-security-overview",
      "workflow-overview",
    ][index] as AssetSlug,
    title,
    audience:
      index === 0
        ? "Sales teams"
        : index === 1
          ? "Executives"
          : "Buyers and operators",
    summary: `A concise, presentation-ready ${title.toLowerCase()} for VAYON.`,
    sections: [
      "Business challenge",
      "VAYON approach",
      "Governance and security",
      "Recommended next step",
    ],
  })),
];
export const customerStories: readonly CustomerStory[] = [
  {
    slug: "case-study-template",
    kind: "case-study",
    title: "Case Study Template",
    industry: "Real estate",
    summary:
      "A reusable structure for approved challenge, implementation, evidence, and outcome narratives.",
    evidenceStatus: "template",
  },
  {
    slug: "testimonial-template",
    kind: "testimonial",
    title: "Testimonial Template",
    industry: "Real estate",
    summary:
      "A governed template for customer-approved quotations and attribution.",
    evidenceStatus: "template",
  },
  {
    slug: "success-story-template",
    kind: "success-story",
    title: "Success Story Template",
    industry: "Real estate",
    summary: "A reusable narrative for verified operational transformation.",
    evidenceStatus: "template",
  },
  {
    slug: "reference-customer-template",
    kind: "reference-customer",
    title: "Reference Customer Template",
    industry: "Real estate",
    summary: "A consent-aware structure for reference program participation.",
    evidenceStatus: "template",
  },
];
export class MarketingAssetsRepository {
  industries() {
    return industries;
  }
  industry(slug: string) {
    return industries.find((x) => x.slug === slug);
  }
  comparisons() {
    return comparisons;
  }
  comparison(slug: string) {
    return comparisons.find((x) => x.slug === slug);
  }
  assets() {
    return marketingAssets;
  }
  asset(slug: string) {
    return marketingAssets.find((x) => x.slug === slug);
  }
  stories() {
    return customerStories;
  }
  story(slug: string) {
    return customerStories.find((x) => x.slug === slug);
  }
}
