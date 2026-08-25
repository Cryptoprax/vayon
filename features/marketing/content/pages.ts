import type { Metadata } from "next";

export type MarketingPageId =
  | "product"
  | "ai-workforce"
  | "crm"
  | "properties"
  | "deals"
  | "communications"
  | "calendar"
  | "workflows"
  | "integrations"
  | "security"
  | "enterprise"
  | "pricing"
  | "customers"
  | "resources"
  | "blog"
  | "docs"
  | "about"
  | "careers"
  | "contact";

export interface MarketingPageContent {
  readonly id: MarketingPageId;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly features: readonly {
    readonly title: string;
    readonly description: string;
  }[];
  readonly benefits: readonly string[];
}

const page = (
  id: MarketingPageId,
  eyebrow: string,
  title: string,
  description: string,
  features: MarketingPageContent["features"],
  benefits: readonly string[],
): MarketingPageContent =>
  Object.freeze({
    id,
    eyebrow,
    title,
    description,
    features: Object.freeze(features),
    benefits: Object.freeze(benefits),
  });

export const marketingPages: Readonly<
  Record<MarketingPageId, MarketingPageContent>
> = Object.freeze({
  product: page(
    "product",
    "Vayon OS",
    "One operating system for the real estate enterprise.",
    "Unify customer relationships, properties, transactions, communications, governance, and intelligence in one coherent workspace.",
    [
      {
        title: "AI Workforce + CRM",
        description:
          "Specialist AI employees work from governed customer and sales context.",
      },
      {
        title: "Creative Cloud + Marketing",
        description:
          "Brand, documents, images, video and campaigns share one accountable production model.",
      },
      {
        title: "Sales + Customer Success",
        description:
          "Acquisition, pipeline, adoption, renewal and customer health stay connected.",
      },
      {
        title: "Founder OS + Business Intelligence",
        description:
          "Executive decisions use cross-module evidence, platform health and explainable recommendations.",
      },
    ],
    [
      "One consistent operating model",
      "Provider-neutral foundations",
      "Workspace-scoped governance",
    ],
  ),
  "ai-workforce": page(
    "ai-workforce",
    "AI Workforce",
    "Advisory intelligence, accountable by design.",
    "Give executive, sales, and operations teams explainable recommendations without surrendering human control.",
    [
      {
        title: "Role-based advisors",
        description:
          "Purpose-built views for executive, sales, and operations contexts.",
      },
      {
        title: "Explainability",
        description:
          "Confidence, limitations, and source references stay visible.",
      },
      {
        title: "Approval first",
        description:
          "The workforce recommends and drafts; authorized people decide.",
      },
    ],
    [
      "Human approval boundaries",
      "Provider-neutral AI runtime",
      "Evidence-linked recommendations",
    ],
  ),
  crm: page(
    "crm",
    "CRM",
    "Customer context without fragmented workflows.",
    "Connect leads, contacts, companies, activities, and follow-ups through a consistent enterprise CRM experience.",
    [
      {
        title: "Customer 360",
        description:
          "A unified view of relationships, activity, and related work.",
      },
      {
        title: "Lead workspaces",
        description:
          "Structured views support prioritization and follow-through.",
      },
      {
        title: "Shared timeline",
        description:
          "Chronological context remains available across the platform.",
      },
    ],
    [
      "Consistent lifecycle views",
      "Enterprise search patterns",
      "Governed activity history",
    ],
  ),
  properties: page(
    "properties",
    "Property intelligence",
    "Turn property inventory into connected business context.",
    "Manage portfolio discovery, availability, documents, relationships, and evidence-safe analytics from one platform.",
    [
      {
        title: "Portfolio views",
        description:
          "Grid, map-ready, availability, and analytical perspectives.",
      },
      {
        title: "Connected records",
        description:
          "Relate assets to customers, deals, communications, and calendar activity.",
      },
      {
        title: "Document context",
        description:
          "Keep property materials discoverable without losing governance.",
      },
    ],
    [
      "Multiple inventory perspectives",
      "Readiness for provider ingestion",
      "Explainable assistance",
    ],
  ),
  deals: page(
    "deals",
    "Deal Room",
    "Give every transaction a governed workspace.",
    "Coordinate pipeline, offers, contracts, checklists, approvals, and stakeholder context around each deal.",
    [
      {
        title: "Transaction workspace",
        description: "Bring commercial context and next steps into one view.",
      },
      {
        title: "Offer visibility",
        description: "Track offer state and supporting records consistently.",
      },
      {
        title: "Approval controls",
        description:
          "Keep material decisions inside explicit policy boundaries.",
      },
    ],
    [
      "End-to-end deal context",
      "Approval-aware workflows",
      "Evidence-safe analytics",
    ],
  ),
  communications: page(
    "communications",
    "Communications",
    "One workspace for every business conversation.",
    "Prepare teams for provider-neutral email, messaging, meetings, calls, templates, and internal collaboration.",
    [
      {
        title: "Unified inbox",
        description: "Channel-neutral conversation models keep work coherent.",
      },
      {
        title: "Conversation timeline",
        description:
          "Messages, notes, activities, and attachments share chronology.",
      },
      {
        title: "Governed composer",
        description:
          "Drafting and scheduling architecture remains separate from sending.",
      },
    ],
    [
      "Shared ownership and status",
      "Future provider portability",
      "Communication intelligence readiness",
    ],
  ),
  calendar: page(
    "calendar",
    "Calendar",
    "Coordinate time, work, and customer commitments.",
    "Bring meetings, site visits, calls, tasks, and reminders into a consistent scheduling workspace.",
    [
      {
        title: "Multiple views",
        description:
          "Agenda, day, week, and month views serve different planning needs.",
      },
      {
        title: "Conflict awareness",
        description:
          "Deterministic checks make scheduling constraints visible.",
      },
      {
        title: "Connected context",
        description:
          "Relate calendar work to customers, properties, deals, and communications.",
      },
    ],
    [
      "Provider-neutral scheduling",
      "Workspace context",
      "Governed meeting actions",
    ],
  ),
  workflows: page(
    "workflows",
    "Workflow and approvals",
    "Automate coordination without losing control.",
    "Design workflows, route approvals, and preserve an auditable decision trail before any future execution.",
    [
      {
        title: "Visual design",
        description:
          "Model triggers, conditions, actions, delays, notifications, and AI steps.",
      },
      {
        title: "Approval policies",
        description:
          "Executable intent remains gated by explicit human authority.",
      },
      {
        title: "Audit history",
        description:
          "Transitions, requests, decisions, and outcomes stay traceable.",
      },
    ],
    [
      "Deterministic lifecycle",
      "Fail-closed execution boundary",
      "Provider-neutral adapters",
    ],
  ),
  integrations: page(
    "integrations",
    "Integrations",
    "A governed control plane for connected services.",
    "Discover provider capabilities, inspect authorization, monitor health, and prepare connections without coupling business logic.",
    [
      {
        title: "Provider registry",
        description:
          "Current and future providers register through shared contracts.",
      },
      {
        title: "Connection health",
        description:
          "Authorization, validation, latency, and diagnostics remain visible.",
      },
      {
        title: "Credential safety",
        description:
          "Interfaces expose masked references rather than secret values.",
      },
    ],
    [
      "Google and Microsoft readiness",
      "WhatsApp Cloud foundation",
      "Centralized administration",
    ],
  ),
  security: page(
    "security",
    "Security",
    "Enterprise governance built into the operating model.",
    "Vayon is designed for layered access control, auditability, encrypted credentials, approval workflows, and safe AI boundaries.",
    [
      {
        title: "Authentication",
        description:
          "Server-validated sessions and provider-safe identity flows protect access.",
      },
      {
        title: "Encryption",
        description:
          "Transport security and protected provider credentials reduce secret exposure.",
      },
      {
        title: "Role-based access",
        description:
          "Central permissions enforce least privilege across UI and server boundaries.",
      },
      {
        title: "Tenant isolation",
        description:
          "Organization and workspace scope prevent cross-tenant access.",
      },
      {
        title: "Backups",
        description:
          "Operational recovery procedures are documented; production evidence remains independently verified.",
      },
      {
        title: "Audit logs",
        description:
          "Sensitive actions, approvals and denials preserve accountable history.",
      },
      {
        title: "AI safety",
        description:
          "Evidence, confidence, human approval and provider abstraction govern AI work.",
      },
      {
        title: "Compliance roadmap",
        description:
          "Controls support future assurance programs; no certification is implied.",
      },
      {
        title: "Responsible disclosure",
        description:
          "Security concerns may be reported to security@vayon.online when the mailbox is configured.",
      },
    ],
    [
      "Encryption-ready credential storage",
      "Auditable business events",
      "Human approval policies",
    ],
  ),
  enterprise: page(
    "enterprise",
    "Enterprise",
    "Operate complex real estate organizations with clarity.",
    "Bring administration, analytics, workflows, integrations, and advisory intelligence into one scalable workspace model.",
    [
      {
        title: "Organization control",
        description:
          "Model users, roles, teams, departments, organizations, and workspaces.",
      },
      {
        title: "Executive visibility",
        description:
          "Evidence-aware analytics and narratives support leadership context.",
      },
      {
        title: "Platform extensibility",
        description:
          "Provider registries and universal contracts reduce future coupling.",
      },
    ],
    [
      "Multi-workspace readiness",
      "Governance-first architecture",
      "Unified design language",
    ],
  ),
  pricing: page(
    "pricing",
    "Pricing",
    "A plan for every stage of operational maturity.",
    "Compare production Vayon editions. Pricing available at launch is now represented by the approved Stripe plan catalog.",
    [],
    [
      "Monthly and annual presentation",
      "Clear capability comparison",
      "Enterprise consultation path",
    ],
  ),
  customers: page(
    "customers",
    "Customers",
    "Built for the many shapes of real estate work.",
    "Explore representative industry scenarios. Published customer stories will appear only after customer approval.",
    [],
    [
      "Commercial real estate",
      "Residential brokerages",
      "Developers and property managers",
    ],
  ),
  resources: page(
    "resources",
    "Resources",
    "Practical guidance for building an intelligent operation.",
    "Explore documentation, guides, videos, playbooks, and API-readiness resources as they become available.",
    [],
    [
      "Architecture documentation",
      "Operational playbooks",
      "Integration guides",
    ],
  ),
  blog: page(
    "blog",
    "Vayon Journal",
    "Ideas for the intelligent real estate enterprise.",
    "A publication-ready home for product, operations, AI governance, integration, and customer experience thinking.",
    [],
    ["Product", "Operations", "AI governance"],
  ),
  docs: page(
    "docs",
    "Documentation",
    "Understand how Vayon fits together.",
    "A structured documentation entry point for platform architecture, administration, integrations, workflows, and security.",
    [],
    ["Platform concepts", "Administrator guides", "Developer architecture"],
  ),
  about: page(
    "about",
    "About Vayon",
    "Building the operating system for modern real estate companies.",
    "Vayon brings fragmented business context into a coherent, governable enterprise platform.",
    [
      {
        title: "Mission",
        description:
          "Give every business a coherent, accountable operating system powered by governed AI.",
      },
      {
        title: "Vision",
        description:
          "A future where teams coordinate customers, creativity and decisions without fragmented context.",
      },
      {
        title: "Leadership",
        description:
          "Founder and leadership profiles are prepared for publication after approval.",
      },
    ],
    [
      "Enterprise craft",
      "Responsible intelligence",
      "Long-term platform thinking",
    ],
  ),
  careers: page(
    "careers",
    "Careers",
    "Help build a more coherent business operating system.",
    "Future roles will be published here when hiring opens. Vayon does not currently list active positions on this page.",
    [],
    ["Engineering", "Product and design", "Customer experience"],
  ),
  contact: page(
    "contact",
    "Contact",
    "Start a conversation with Vayon.",
    "Use the launch contact channels when published. This page does not submit or retain personal information yet.",
    [],
    ["Enterprise evaluation", "Partnerships", "Product questions"],
  ),
});

export function marketingMetadata(id: MarketingPageId): Metadata {
  const value = marketingPages[id],
    url = `/${id}`;
  return {
    title: value.title,
    description: value.description,
    alternates: { canonical: url },
    openGraph: {
      title: value.title,
      description: value.description,
      url,
      type: "website",
      siteName: "Vayon",
    },
    twitter: {
      card: "summary_large_image",
      title: value.title,
      description: value.description,
    },
  };
}
