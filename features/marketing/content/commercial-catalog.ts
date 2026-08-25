import type { CommercialCatalogEntry } from "../components/CommercialCatalogPage";
const commonModules = [
  "CRM",
  "AI Workforce",
  "Creative Studio 2.0",
  "Marketing Studio",
  "Business Intelligence",
] as const;
export const solutionCatalog: readonly CommercialCatalogEntry[] = [
  [
    "startups",
    "Startups",
    "Launch a credible business operation without assembling a fragmented software stack.",
  ],
  [
    "small-business",
    "Small Business",
    "Give a lean team shared customers, campaigns, creative work and AI capacity.",
  ],
  [
    "agencies",
    "Agencies",
    "Coordinate brands, campaigns, approvals, assets and client growth from one workspace.",
  ],
  [
    "enterprise",
    "Enterprise",
    "Standardize governed AI operations across teams, workspaces and regions.",
  ],
  [
    "growing-companies",
    "Growing Companies",
    "Scale customer acquisition and delivery without losing context or control.",
  ],
].map(([slug, name, summary]) => ({
  slug,
  name,
  summary,
  problems: [
    "Disconnected tools and duplicated context",
    "Manual handoffs and limited operating visibility",
    "Inconsistent governance as the team grows",
  ],
  outcomes: [
    "Faster time to value",
    "Coordinated customer and creative execution",
    "Evidence-backed decisions with human control",
  ],
  modules: commonModules,
}));
export const industryCatalog: readonly CommercialCatalogEntry[] = [
  ["solar", "Solar"],
  ["real-estate", "Real Estate"],
  ["hotels", "Hotels"],
  ["healthcare", "Healthcare"],
  ["construction", "Construction"],
  ["marketing-agencies", "Marketing Agencies"],
  ["professional-services", "Professional Services"],
  ["retail", "Retail"],
  ["manufacturing", "Manufacturing"],
].map(([slug, name]) => ({
  slug,
  name,
  summary: `Connect ${name.toLowerCase()} customer acquisition, sales, content and operations in one governed AI workspace.`,
  problems: [
    "Fragmented customer and operational data",
    "Slow follow-up and content production",
    "Limited cross-team visibility",
  ],
  outcomes: [
    "Consistent customer journeys",
    "Faster campaign and sales execution",
    "Clear ownership, approvals and reporting",
  ],
  modules: ["CRM", "Marketing Studio", "Creative Studio 2.0", "AI Workforce"],
  workflows: [
    "Qualify and route a new enquiry",
    "Create an approved multi-channel campaign",
    "Prepare an evidence-backed executive brief",
  ],
}));
export const productCatalog: readonly CommercialCatalogEntry[] = [
  ["ai-business-launch", "AI Business Launch"],
  ["ai-workforce", "AI Workforce"],
  ["crm", "CRM"],
  ["brand-studio", "Brand Studio"],
  ["creative-studio", "Creative Studio"],
  ["document-studio", "Document Studio"],
  ["image-studio", "Image Studio"],
  ["video-studio", "Video Studio"],
  ["campaign-studio", "Campaign Studio"],
  ["marketing-studio", "Marketing Studio"],
  ["sales-workspace", "Sales Workspace"],
  ["customer-success", "Customer Success"],
  ["founder-dashboard", "Founder Dashboard"],
  ["business-intelligence", "Business Intelligence"],
].map(([slug, name]) => ({
  slug,
  name,
  summary: `Use ${name} inside the connected VAYON operating model.`,
  problems: [
    "Fragmented specialist workflows",
    "Repeated context transfer",
    "Limited governance and traceability",
  ],
  outcomes: [
    "One accountable workspace",
    "Faster high-quality execution",
    "Reusable business context",
  ],
  modules: [name, "AI Workforce", "Workflow Automation"],
}));
