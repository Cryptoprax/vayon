import type {
  BusinessLaunchInput,
  BusinessLaunchItem,
  LaunchDeliverable,
} from "./types";
const owners: Record<LaunchDeliverable, readonly [string, string, boolean]> = {
  "Brand Identity": ["Brand Studio", "/vayon/creative/brand", true],
  "CRM Workspace": ["CRM", "/vayon/crm", false],
  "AI Workforce": ["AI Workforce", "/vayon/ai/workforce", true],
  "Company Profile": ["Document Studio", "/vayon/creative/documents", true],
  Brochure: ["Document Studio", "/vayon/creative/documents", true],
  "Pitch Deck": ["Document Studio", "/vayon/creative/documents", true],
  Website: ["Creative Cloud", "/vayon/creative", true],
  "Landing Page": ["Campaign Studio", "/vayon/creative/campaigns", true],
  "Marketing Campaign": ["Campaign Studio", "/vayon/creative/campaigns", true],
  "Product Images": ["Image Studio", "/vayon/creative/images", true],
  "Promotional Video": ["Video Studio", "/vayon/creative/videos", true],
  "Social Media Starter Pack": [
    "Campaign Studio",
    "/vayon/creative/campaigns",
    true,
  ],
  "Email Templates": ["Campaign Studio", "/vayon/creative/campaigns", true],
  "Sales Proposal": ["Document Studio", "/vayon/creative/documents", true],
};
export function planLaunch(
  input: BusinessLaunchInput,
  hasBrand: boolean,
  providersReady: boolean,
): {
  items: BusinessLaunchItem[];
  business: number;
  creative: number;
  minutes: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (!hasBrand && !input.deliverables.includes("Brand Identity"))
    warnings.push("Create or select a Brand Kit before creative production.");
  if (
    !providersReady &&
    input.deliverables.some((x) =>
      [
        "Company Profile",
        "Brochure",
        "Pitch Deck",
        "Product Images",
        "Promotional Video",
        "Sales Proposal",
      ].includes(x),
    )
  )
    warnings.push(
      "One or more AI providers are unavailable; affected items will remain WaitingProvider in their existing studio.",
    );
  const items = input.deliverables.map((deliverable, index) => {
    const [owner, route, approvalRequired] = owners[deliverable];
    return {
      id: `launch-${index + 1}`,
      deliverable,
      owner,
      route,
      approvalRequired,
      state: approvalRequired ? "Waiting Approval" : "Ready",
      warning:
        !hasBrand && owner !== "CRM" ? "Brand resolution required" : null,
    } satisfies BusinessLaunchItem;
  });
  const profileSignals = [
    input.businessName,
    input.industry,
    input.country,
    input.primaryLanguage,
    input.businessType,
  ].filter(Boolean).length;
  const business = Math.min(
    100,
    profileSignals * 12 +
      Math.min(20, input.goals.length * 5) +
      Math.min(20, input.audiences.length * 5),
  );
  const creative = Math.min(
    100,
    (hasBrand ? 35 : input.deliverables.includes("Brand Identity") ? 20 : 0) +
      Math.min(45, input.deliverables.length * 4) +
      (input.website ? 10 : 0) +
      (input.goals.length ? 10 : 0),
  );
  return {
    items,
    business,
    creative,
    minutes: Math.max(10, input.deliverables.length * 8),
    warnings,
  };
}
