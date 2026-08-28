import type { CommercialCatalogEntry } from "../components/CommercialCatalogPage";
export const solutionCatalog: readonly CommercialCatalogEntry[] = [
  {
    slug: "ai-sales-employees",
    name: "AI Sales Employees",
    summary:
      "Give every property enquiry an immediate, consistent and accountable first response.",
    solution:
      "VAYON AI Sales Employees qualify buyer intent, prepare property recommendations, book appointments and route each opportunity to the right agent while people retain approval.",
    problems: [
      "New enquiries wait too long for a response",
      "Agents spend time repeating qualification questions",
      "High-intent buyers are lost inside crowded pipelines",
    ],
    outcomes: [
      "Faster lead response",
      "Consistent buyer qualification",
      "Clear agent ownership and next actions",
    ],
    modules: [
      "AI Sales Manager",
      "Lead Qualification",
      "Property Matching",
      "Appointments",
    ],
    screenshots: [
      "Lead qualification workspace",
      "AI-prepared property shortlist",
    ],
  },
  {
    slug: "real-estate-crm",
    name: "Real Estate CRM",
    summary:
      "Keep buyers, sellers, listings, agents, conversations and deals in one connected record.",
    solution:
      "VAYON connects relationship history, property requirements, activities, site visits and deal progress so agents always know the context and the next action.",
    problems: [
      "Buyer and seller context is scattered across tools",
      "Property requirements become outdated",
      "Managers cannot see complete agent follow-up",
    ],
    outcomes: [
      "One customer and property timeline",
      "Cleaner pipeline ownership",
      "More relevant follow-up",
    ],
    modules: ["CRM", "Lead Management", "Property Database", "Deal Pipeline"],
    screenshots: ["Buyer relationship overview", "Real estate pipeline view"],
  },
  {
    slug: "property-management",
    name: "Property Management",
    summary:
      "Organize property inventory, owners, availability, documents and operational activity.",
    solution:
      "VAYON gives teams one governed property workspace connected to owners, buyers, tenants, agents, appointments and active transactions.",
    problems: [
      "Property information is duplicated or incomplete",
      "Availability changes do not reach every agent",
      "Documents and operational tasks lose context",
    ],
    outcomes: [
      "Trusted property records",
      "Clear availability and ownership",
      "Connected documents, tasks and relationships",
    ],
    modules: ["Property Database", "Document Studio", "Tasks", "Analytics"],
    screenshots: [
      "Property inventory workspace",
      "Property detail and activity view",
    ],
  },
  {
    slug: "lead-generation",
    name: "Lead Generation",
    summary:
      "Turn campaigns, listing pages and property interest into qualified opportunities.",
    solution:
      "VAYON connects real estate campaigns to incoming enquiries, qualification, source context and agent assignment without inventing performance data.",
    problems: [
      "Campaign leads arrive without useful context",
      "Lead sources and property interest are disconnected",
      "Teams cannot prioritize genuine buyer intent",
    ],
    outcomes: [
      "Structured lead capture",
      "Source-aware qualification",
      "Faster routing to the right agent",
    ],
    modules: ["Lead Capture", "Campaigns", "AI Qualification", "CRM"],
    screenshots: [
      "Real estate lead command center",
      "Campaign-to-enquiry journey",
    ],
  },
  {
    slug: "whatsapp-automation",
    name: "WhatsApp Automation",
    summary:
      "Prepare timely property conversations without losing human control.",
    solution:
      "VAYON drafts contextual replies, property suggestions, appointment confirmations and follow-ups from approved CRM and listing context. Sending remains governed.",
    problems: [
      "Buyer follow-up is inconsistent",
      "Agents rewrite the same property information",
      "Conversations are separated from CRM context",
    ],
    outcomes: [
      "Faster response preparation",
      "Consistent approved messaging",
      "Complete conversation context",
    ],
    modules: ["WhatsApp", "AI Drafting", "Templates", "CRM Timeline"],
    screenshots: ["Connected WhatsApp inbox", "AI-assisted response composer"],
  },
  {
    slug: "marketing-automation",
    name: "Marketing Automation",
    summary:
      "Plan listing, launch, open-house and nurture campaigns from one workspace.",
    solution:
      "VAYON coordinates audiences, content, approvals, campaign stages and follow-up recommendations while publishing remains a human decision.",
    problems: [
      "Campaign work is spread across disconnected tools",
      "Property launches lack consistent follow-through",
      "Approvals delay content and channel readiness",
    ],
    outcomes: [
      "Coordinated campaign planning",
      "Faster review and approval",
      "Connected marketing and sales context",
    ],
    modules: [
      "Campaigns",
      "Content Calendar",
      "Approvals",
      "Growth Intelligence",
    ],
    screenshots: ["Property campaign pipeline", "Real estate content calendar"],
  },
  {
    slug: "creative-studio",
    name: "Creative Studio",
    summary:
      "Create brand-consistent property campaigns, brochures and social assets.",
    solution:
      "VAYON turns approved property and brand context into review-ready creative packs for listings, developments, open houses and agent outreach.",
    problems: [
      "Property creative takes too long to assemble",
      "Brand quality varies between agents and projects",
      "Asset feedback is difficult to track",
    ],
    outcomes: [
      "Faster creative preparation",
      "Consistent real estate branding",
      "Governed review-ready assets",
    ],
    modules: [
      "Creative Studio",
      "Brand Assets",
      "Campaign Packs",
      "Review Workflow",
    ],
    screenshots: ["Property creative workspace", "Campaign asset review"],
  },
  {
    slug: "executive-dashboard",
    name: "Executive Dashboard",
    summary:
      "See real estate pipeline, revenue, agent activity and operational priorities together.",
    solution:
      "VAYON brings evidence-backed commercial and operational context into one leadership view, with unavailable data clearly identified rather than fabricated.",
    problems: [
      "Leadership reporting is assembled manually",
      "Pipeline and activity views disagree",
      "Risks surface too late",
    ],
    outcomes: [
      "One executive operating view",
      "Earlier visibility into pipeline risk",
      "Evidence-linked priorities",
    ],
    modules: ["Founder Dashboard", "Analytics", "Revenue", "AI Briefings"],
    screenshots: [
      "Executive real estate overview",
      "Pipeline and revenue briefing",
    ],
  },
  {
    slug: "growth-intelligence",
    name: "Growth Intelligence",
    summary:
      "Coordinate real estate campaigns, brand, content and growth recommendations.",
    solution:
      "VAYON acts as an approval-first AI CMO workspace for property launches, market visibility, content planning and campaign execution.",
    problems: [
      "Marketing priorities are reactive",
      "Content and campaign plans lack shared context",
      "Sales and marketing signals remain disconnected",
    ],
    outcomes: [
      "Clear growth recommendations",
      "Connected content and campaign planning",
      "Human-approved execution",
    ],
    modules: ["Growth Overview", "AI CMO", "Content Calendar", "Analytics"],
    screenshots: [
      "Growth intelligence overview",
      "AI CMO recommendation panel",
    ],
  },
];
export const industryCatalog: readonly CommercialCatalogEntry[] = [
  ["solar", "Residential Real Estate"],
  ["real-estate", "Real Estate"],
  ["hotels", "Luxury Real Estate"],
  ["healthcare", "Real Estate Brokerages"],
  ["construction", "Property Developers"],
  ["marketing-agencies", "Real Estate Marketing Teams"],
  ["professional-services", "Commercial Real Estate"],
  ["retail", "Property Investment Firms"],
  ["manufacturing", "Large Real Estate Groups"],
].map(([slug, name]) => ({
  slug,
  name,
  summary: `Connect ${name.toLowerCase()} leads, properties, agents, marketing and deal operations in one governed AI workspace.`,
  problems: [
    "Fragmented buyer, seller, and property data",
    "Slow WhatsApp follow-up and listing content production",
    "Limited agent and pipeline visibility",
  ],
  outcomes: [
    "Consistent buyer and seller journeys",
    "Faster listing campaign and property sales execution",
    "Clear ownership, approvals and reporting",
  ],
  modules: ["CRM", "Marketing Studio", "Creative Studio 2.0", "AI Workforce"],
  workflows: [
    "Qualify a property enquiry and assign an agent",
    "Create an approved listing or open-house campaign",
    "Prepare an evidence-backed pipeline and revenue brief",
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
