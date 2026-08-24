export const creativeOutputs = [
  "Brand",
  "Company Profile",
  "Brochure",
  "Catalogue",
  "Pitch Deck",
  "Website",
  "Landing Page",
  "Marketing Campaign",
  "Email Campaign",
  "Images",
  "Product Mockups",
  "Social Media",
  "Advertisement",
  "Video",
  "CRM Setup",
  "Business Launch Project",
] as const;
export type CreativeOutput = (typeof creativeOutputs)[number];
export type CreativeRoute =
  | "/vayon/creative/brand"
  | "/vayon/creative/documents"
  | "/vayon/creative/images"
  | "/vayon/creative/videos"
  | "/vayon/creative/campaigns"
  | "/onboarding/business-launch";
export interface CreativePlanItem {
  readonly output: CreativeOutput;
  readonly studio: string;
  readonly route: CreativeRoute;
  readonly status: "Queued";
  readonly approvalRequired: boolean;
}
export interface CreativeExecutionPlan {
  readonly title: string;
  readonly prompt: string;
  readonly items: readonly CreativePlanItem[];
  readonly estimatedMinutes: number;
  readonly estimatedCostUsd: number | null;
  readonly requiredProviders: readonly string[];
  readonly suggestedFollowUps: readonly string[];
  readonly primaryRoute: CreativeRoute;
}
const definitions: readonly [CreativeOutput, string, CreativeRoute, RegExp][] =
  [
    ["Brand", "Brand Studio", "/vayon/creative/brand", /brand|logo|identity/i],
    [
      "Company Profile",
      "Document Studio",
      "/vayon/creative/documents",
      /company profile|corporate introduction/i,
    ],
    ["Brochure", "Document Studio", "/vayon/creative/documents", /brochure/i],
    [
      "Catalogue",
      "Document Studio",
      "/vayon/creative/documents",
      /catalog(?:ue)?/i,
    ],
    [
      "Pitch Deck",
      "Document Studio",
      "/vayon/creative/documents",
      /pitch|investor/i,
    ],
    ["Website", "Campaign Studio", "/vayon/creative/campaigns", /website/i],
    [
      "Landing Page",
      "Campaign Studio",
      "/vayon/creative/campaigns",
      /landing page/i,
    ],
    [
      "Marketing Campaign",
      "Campaign Studio",
      "/vayon/creative/campaigns",
      /marketing|campaign|launch/i,
    ],
    [
      "Email Campaign",
      "Campaign Studio",
      "/vayon/creative/campaigns",
      /email/i,
    ],
    ["Images", "Image Studio", "/vayon/creative/images", /image|photo|visual/i],
    [
      "Product Mockups",
      "Image Studio",
      "/vayon/creative/images",
      /mockup|product image/i,
    ],
    [
      "Social Media",
      "Campaign Studio",
      "/vayon/creative/campaigns",
      /social|instagram|facebook|linkedin/i,
    ],
    [
      "Advertisement",
      "Campaign Studio",
      "/vayon/creative/campaigns",
      /advert|ads?\b|commercial/i,
    ],
    ["Video", "Video Studio", "/vayon/creative/videos", /video|reel|youtube/i],
    [
      "CRM Setup",
      "Business Launch Mode",
      "/onboarding/business-launch",
      /crm|leads?|sales setup/i,
    ],
    [
      "Business Launch Project",
      "Business Launch Mode",
      "/onboarding/business-launch",
      /starting|start|launch|build.+company|complete marketing|new business|new company/i,
    ],
  ];
const launchBundle: readonly CreativeOutput[] = [
  "Business Launch Project",
  "Brand",
  "Company Profile",
  "Brochure",
  "Pitch Deck",
  "Landing Page",
  "Marketing Campaign",
  "Images",
  "Video",
  "Social Media",
  "CRM Setup",
];
export function analyzeCreativeIntent(prompt: string): CreativeExecutionPlan {
  const launch =
      /starting|start|launch|build.+company|complete marketing|new business|new company/i.test(
        prompt,
      ),
    wanted = launch
      ? launchBundle
      : definitions
          .filter(([, , , pattern]) => pattern.test(prompt))
          .map(([output]) => output),
    outputs = wanted.length ? wanted : ["Marketing Campaign" as const];
  const items = [...new Set(outputs)].map((output) => {
      const match = definitions.find(([candidate]) => candidate === output)!;
      return {
        output,
        studio: match[1],
        route: match[2],
        status: "Queued",
        approvalRequired: true,
      } as const;
    }),
    providerOutputs = items.filter((x) =>
      ["Document Studio", "Image Studio", "Video Studio"].includes(x.studio),
    );
  return {
    title: launch ? "Business Launch" : `${items[0].output} execution`,
    prompt,
    items,
    estimatedMinutes: Math.max(8, items.length * 8),
    estimatedCostUsd: providerOutputs.length
      ? Number((providerOutputs.length * 0.12).toFixed(2))
      : null,
    requiredProviders: providerOutputs.length
      ? ["OpenAI through Creative Runtime"]
      : [],
    primaryRoute: launch ? "/onboarding/business-launch" : items[0].route,
    suggestedFollowUps: [
      "Generate Website",
      "Generate Sales Proposal",
      "Generate WhatsApp Campaign",
      "Generate LinkedIn Campaign",
      "Generate Google Ads",
      "Generate Facebook Ads",
      "Generate Email Sequence",
    ],
  };
}
export const creativeExecutionStages = [
  "Queued",
  "Planning",
  "Generating Documents",
  "Generating Images",
  "Generating Videos",
  "Reviewing",
  "Completed",
  "Waiting Provider",
  "Retry",
  "Cancelled",
] as const;
