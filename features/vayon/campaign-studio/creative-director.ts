import { deliverableGroups } from "./catalog";
import type {
  CampaignBlueprint,
  CampaignBrief,
  CreativeDepartment,
} from "./types";
const departmentFor = (item: string): CreativeDepartment => {
  if (["Pitch Deck", "Sales Presentation"].includes(item))
    return "Presentation Designer";
  if (
    [
      "15 Second Reel",
      "30 Second Commercial",
      "Product Demo",
      "Corporate Video",
      "Website Hero",
      "Investor Video",
      "Shorts",
    ].includes(item)
  )
    return "Video Producer";
  if (
    [
      "Facebook",
      "Instagram",
      "LinkedIn",
      "X",
      "YouTube",
      "TikTok",
      "WhatsApp",
    ].includes(item)
  )
    return "Social Media Manager";
  if (item.includes("Ads") || item.startsWith("Google"))
    return "Advertising Specialist";
  if (
    [
      "Landing Page",
      "Contact Page",
      "Thank You Page",
      "Product Pages",
      "Lead Capture",
    ].includes(item)
  )
    return "Landing Page Designer";
  if (
    [
      "Welcome Email",
      "Newsletter",
      "Product Launch",
      "Investor Email",
      "Follow-up Sequence",
    ].includes(item)
  )
    return "Email Marketing Specialist";
  if (
    [
      "Logo Refresh",
      "Brand Guidelines",
      "Color Update",
      "Typography",
      "QR Assets",
      "Business Cards",
      "Letterhead",
      "Email Signature",
    ].includes(item)
  )
    return "Brand Designer";
  if (
    [
      "Press Release",
      "Whitepaper",
      "FAQ",
      "User Guide",
      "Installation Guide",
      "Proposal",
      "Quotation",
      "Pricing Sheet",
      "Product Datasheet",
      "Case Study",
    ].includes(item)
  )
    return "Copywriter";
  return "Graphic Designer";
};
export function buildCampaignBlueprint(
  brief: CampaignBrief,
  brandScore: number,
): CampaignBlueprint {
  const all = new Set(Object.values(deliverableGroups).flat()),
    valid = brief.deliverables.filter((item) => all.has(item as never)),
    tasks = valid.map((deliverable, index) => ({
      id: `task-${index + 1}`,
      deliverable,
      department: departmentFor(deliverable),
      dependencies:
        index && ["Logo Refresh", "Brand Guidelines"].includes(valid[0] ?? "")
          ? ["task-1"]
          : [],
      approvalRequired: true as const,
      state: "planned" as const,
    })),
    missing = [] as string[];
  if (!brief.brandIds.length) missing.push("Approved brand");
  if (!valid.length) missing.push("Campaign deliverables");
  if (!brief.languages.length) missing.push("Campaign language");
  const completeness = Math.max(0, 100 - missing.length * 25),
    risks = [
      ...(brandScore < 70
        ? ["Brand consistency requires review before creative work."]
        : []),
      ...(!valid.length ? ["No deliverables selected."] : []),
      ...(valid.length > 30
        ? ["Large campaign may require phased delivery."]
        : []),
    ];
  return {
    tasks,
    estimatedOutputs: valid.length,
    estimatedCompletionDays: Math.max(1, Math.ceil(valid.length / 3)),
    brandReadiness: brandScore,
    creativeReadiness: completeness,
    creativeScore: Math.round((brandScore + completeness) / 2),
    completeness,
    requiredApprovals: [
      "Creative Review",
      "Brand Review",
      "Management Approval",
    ],
    missingAssets: missing,
    recommendations: [
      ...(valid.length < 3
        ? ["Add supporting deliverables for a complete channel journey."]
        : []),
      ...(!valid.some((item) => item.includes("Landing Page")) &&
      brief.objective === "Generate Leads"
        ? ["Add a landing page and lead capture deliverable."]
        : []),
      ...(!valid.some((item) => item.includes("Email"))
        ? ["Consider an email follow-up asset."]
        : []),
    ],
    risks,
    providerState: "unavailable",
    executionEnabled: false,
  };
}
export const creativeDepartments = [
  "Brand Designer",
  "Graphic Designer",
  "Presentation Designer",
  "Copywriter",
  "Motion Designer",
  "Video Producer",
  "Social Media Manager",
  "Advertising Specialist",
  "Landing Page Designer",
  "Email Marketing Specialist",
] as const;
