import type {
  DocumentationArticle,
  DocumentationSearch,
  OpenApiResource,
} from "../contracts/documentation";

const topics = [
  [
    "getting-started",
    "Getting started",
    "Foundations",
    "Start with VAYON and understand the governed workspace model.",
  ],
  [
    "quick-start",
    "Quick start",
    "Foundations",
    "Launch an organization, invite a team, and configure your first workflow.",
  ],
  [
    "installation",
    "Installation",
    "Foundations",
    "Prepare development, staging, and production environments.",
  ],
  [
    "account-setup",
    "Account setup",
    "Foundations",
    "Verify identity, secure sessions, and configure your profile.",
  ],
  [
    "organization-setup",
    "Organization setup",
    "Administration",
    "Configure tenant identity, branding, locale, and workspace settings.",
  ],
  [
    "team-management",
    "Team management",
    "Administration",
    "Invite members and govern roles, permissions, and ownership.",
  ],
  [
    "billing",
    "Billing",
    "Administration",
    "Manage subscriptions, invoices, usage, and payment methods.",
  ],
  [
    "authentication",
    "Authentication",
    "Security",
    "Implement sessions, MFA, organization switching, and access tokens.",
  ],
  [
    "security",
    "Security",
    "Security",
    "Apply RBAC, RLS, audit logging, and tenant-isolation controls.",
  ],
  [
    "ai-workforce",
    "AI Workforce",
    "AI",
    "Operate governed AI employees with approvals and attribution.",
  ],
  [
    "crm",
    "CRM",
    "CRM",
    "Manage contacts, companies, leads, deals, and relationship timelines.",
  ],
  [
    "sales-ai",
    "Sales AI",
    "AI",
    "Qualify leads and receive evidence-backed sales recommendations.",
  ],
  [
    "crm-ai",
    "CRM AI",
    "AI",
    "Analyze customer health and recommend data-quality improvements.",
  ],
  [
    "whatsapp-ai",
    "WhatsApp AI",
    "AI",
    "Draft governed replies from connected conversation context.",
  ],
  [
    "marketing-ai",
    "Marketing AI",
    "AI",
    "Generate campaign and content recommendations without autonomous publishing.",
  ],
  [
    "executive-ai",
    "Executive AI",
    "AI",
    "Review cross-company health, risks, and executive briefings.",
  ],
  [
    "workflow-engine",
    "Workflow Engine",
    "Automation",
    "Build approval-aware triggers, conditions, recommendations, and actions.",
  ],
  [
    "knowledge-platform",
    "Knowledge Platform",
    "Platform",
    "Publish tenant knowledge and provide cited AI help.",
  ],
  [
    "notification-platform",
    "Notification Platform",
    "Platform",
    "Deliver preference-aware notifications across governed channels.",
  ],
  [
    "email-platform",
    "Email Platform",
    "Platform",
    "Configure a provider-neutral transactional email runtime.",
  ],
  [
    "deployment",
    "Deployment",
    "Operations",
    "Validate configuration, migrations, health, and production readiness.",
  ],
  [
    "troubleshooting",
    "Troubleshooting",
    "Support",
    "Diagnose connections, permissions, runtime health, and delivery failures.",
  ],
  [
    "faq",
    "FAQ",
    "Support",
    "Find concise answers to frequently asked platform questions.",
  ],
  [
    "release-notes",
    "Release notes",
    "Updates",
    "Review version history, announcements, breaking changes, and migrations.",
  ],
  [
    "api-reference",
    "API reference",
    "Developers",
    "Explore authenticated, workspace-scoped API resources.",
  ],
  [
    "developer-guides",
    "Developer guides",
    "Developers",
    "Build integrations using VAYON architecture and governance patterns.",
  ],
] as const;

export const documentationArticles: readonly DocumentationArticle[] =
  topics.map(([slug, title, category, description], index) => ({
    slug,
    title,
    description,
    category,
    section: category,
    audience:
      category === "Developers"
        ? "developer"
        : category === "Administration"
          ? "administrator"
          : "user",
    tags: [category.toLowerCase(), slug.split("-")[0], "vayon"],
    version: "2.0",
    updatedAt: "2026-08-21",
    readingMinutes: 4 + (index % 5),
    popularity: 100 - index,
    blocks: [
      { type: "paragraph", text: description },
      {
        type: "callout",
        tone: slug.includes("security") ? "warning" : "tip",
        title: slug.includes("security")
          ? "Security boundary"
          : "Before you begin",
        text: "All operations remain workspace-attributed, tenant-isolated, and subject to the existing permission and approval policies.",
      },
      {
        type: "steps",
        items: [
          "Confirm your active organization and workspace.",
          "Verify the required role and provider health.",
          "Complete the task and review its audit or timeline event.",
        ],
      },
      ...(slug === "quick-start"
        ? [
            {
              type: "code" as const,
              language: "bash" as const,
              code: "npm install\nnpm run dev",
            },
          ]
        : []),
    ],
    related: topics
      .filter((item) => item[2] === category && item[0] !== slug)
      .slice(0, 3)
      .map((item) => item[0]),
  }));

export const openApiResources: readonly OpenApiResource[] = [
  "Authentication",
  "Organizations",
  "Users",
  "CRM",
  "AI Workforce",
  "Knowledge",
  "Workflow",
  "Notifications",
  "Email",
  "Billing",
  "Health",
  "Observability",
].map((name, index) => ({
  name,
  path:
    index < 3
      ? `/api/v1/${name.toLowerCase().replaceAll(" ", "-")}`
      : `/api/v1/${name.toLowerCase().replaceAll(" ", "-")}`,
  methods: index % 3 === 0 ? ["GET", "POST"] : ["GET"],
  scopes: [`${name.toLowerCase().replaceAll(" ", ":")}:read`],
  description: `OpenAPI-ready ${name} resource contract. Runtime availability is documented per endpoint.`,
}));

export class DocumentationRepository {
  list() {
    return documentationArticles;
  }
  find(slug: string) {
    return documentationArticles.find((article) => article.slug === slug);
  }
  search({ query, category, tags = [], limit = 12 }: DocumentationSearch) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return documentationArticles
      .filter(
        (article) =>
          (!category || article.category === category) &&
          (!tags.length || tags.every((tag) => article.tags.includes(tag))) &&
          (!terms.length ||
            terms.every((term) =>
              `${article.title} ${article.description} ${article.tags.join(" ")}`
                .toLowerCase()
                .includes(term),
            )),
      )
      .slice(0, limit);
  }
  popular(limit = 6) {
    return [...documentationArticles]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }
}
