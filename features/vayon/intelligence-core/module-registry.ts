import type { IntelligenceModule, PageIntelligenceContext } from "./contracts";
const action = (
  kind: IntelligenceModule["actions"][number]["kind"],
  label: string,
  href?: string,
) => ({
  kind,
  label,
  href,
  recommendationOnly: true as const,
  executes: false as const,
});
const modules: readonly IntelligenceModule[] = [
  {
    id: "projects",
    name: "Projects",
    description: "Project setup, towers, inventory and availability.",
    routePrefixes: ["/vayon/properties/projects"],
    capabilities: ["setup guidance", "inventory guidance"],
    helpResources: [
      { label: "Project guides", href: "/vayon/knowledge/help?q=Projects" },
    ],
    suggestedPrompts: [
      "Create my first project",
      "Import units",
      "Explain project setup",
    ],
    actions: [action("navigate", "Create project", "/vayon/properties/new")],
    futureTools: ["project setup coach"],
  },
  {
    id: "crm",
    name: "CRM",
    description: "Leads, customers, deals and activities.",
    routePrefixes: ["/vayon/crm", "/vayon/leads", "/vayon/deals"],
    capabilities: ["guidance", "search", "draft recommendations"],
    helpResources: [
      { label: "CRM guides", href: "/vayon/knowledge/help?q=CRM" },
    ],
    suggestedPrompts: [
      "Import Leads",
      "Explain this pipeline",
      "Show CRM documentation",
    ],
    actions: [
      action("navigate", "Create Lead", "/vayon/leads/new"),
      action("create_draft", "Generate Proposal", "/vayon/deals"),
      action("navigate", "Open CRM", "/vayon/crm"),
      action(
        "show_documentation",
        "CRM documentation",
        "/vayon/knowledge/help?q=CRM",
      ),
    ],
    futureTools: ["lead import assistant"],
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Projects, units, availability and imports.",
    routePrefixes: ["/vayon/properties"],
    capabilities: ["import guidance", "field explanation"],
    helpResources: [
      { label: "Inventory guides", href: "/vayon/knowledge/help?q=Inventory" },
    ],
    suggestedPrompts: [
      "Import Inventory",
      "Explain availability",
      "Open project guide",
    ],
    actions: [
      action("navigate", "Import Inventory", "/vayon/properties/inventory"),
      action("navigate", "Open Inventory", "/vayon/properties/inventory"),
    ],
    futureTools: ["import validator"],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Campaigns, Brand Kits, assets and approvals.",
    routePrefixes: ["/vayon/creative-studio", "/vayon/creative", "/vayon/growth"],
    capabilities: ["campaign guidance", "draft recommendations"],
    helpResources: [
      { label: "Marketing guides", href: "/vayon/knowledge/help?q=Marketing" },
    ],
    suggestedPrompts: [
      "Create Campaign",
      "Create Flyer",
      "Explain approval workflow",
    ],
    actions: [
      action("navigate", "Create Campaign", "/vayon/creative-studio/wizard"),
      action(
        "create_draft",
        "Recommend campaign draft",
        "/vayon/creative-studio/wizard",
      ),
    ],
    futureTools: ["creative advisor"],
  },
  {
    id: "workforce",
    name: "AI Workforce",
    description: "Governed AI employees, tasks, knowledge and collaboration.",
    routePrefixes: ["/vayon/ai", "/vayon/workforce"],
    capabilities: ["role guidance", "task guidance", "employee recommendations"],
    helpResources: [
      { label: "AI Workforce guides", href: "/vayon/knowledge/help?q=AI%20Workforce" },
    ],
    suggestedPrompts: ["Create an AI Sales Employee", "Explain AI employee governance", "Show AI tasks"],
    actions: [
      action("navigate", "Create AI Employee", "/onboarding/ai-workforce"),
      action("navigate", "Open AI Workforce", "/vayon/ai/workforce"),
    ],
    futureTools: ["workforce capacity advisor"],
  },
  {
    id: "billing",
    name: "Billing",
    description: "Plans, subscriptions, usage and invoices.",
    routePrefixes: [
      "/vayon/settings/billing",
      "/vayon/settings/subscription",
      "/vayon/settings/invoices",
    ],
    capabilities: ["plan explanation", "license guidance"],
    helpResources: [
      { label: "Billing guides", href: "/vayon/knowledge/help?q=Billing" },
    ],
    suggestedPrompts: [
      "Explain Plans",
      "Explain usage limits",
      "Show invoices",
    ],
    actions: [
      action("explain_feature", "Explain plans", "/vayon/settings/plans"),
    ],
    futureTools: ["billing diagnostics"],
  },
  {
    id: "communications",
    name: "Communications",
    description: "Inbox, providers, templates and approvals.",
    routePrefixes: ["/vayon/communications", "/vayon/whatsapp", "/vayon/email"],
    capabilities: ["integration guidance", "template help"],
    helpResources: [
      {
        label: "Communications guides",
        href: "/vayon/knowledge/help?q=Communications",
      },
    ],
    suggestedPrompts: [
      "Explain integrations",
      "Create a draft",
      "Check provider guidance",
    ],
    actions: [
      action("navigate", "Connect WhatsApp", "/vayon/whatsapp/settings"),
      action(
        "show_documentation",
        "Integration documentation",
        "/vayon/settings/integrations",
      ),
    ],
    futureTools: ["provider diagnostics"],
  },
  {
    id: "site-visits",
    name: "Site Visits",
    description: "Scheduling, attendance and follow-up.",
    routePrefixes: ["/vayon/site-visits"],
    capabilities: ["workflow guidance"],
    helpResources: [
      {
        label: "Site Visit guides",
        href: "/vayon/knowledge/help?q=Site%20Visits",
      },
    ],
    suggestedPrompts: ["Book first site visit", "Explain follow-up"],
    actions: [
      action("navigate", "Book Visit", "/vayon/site-visits"),
      action("navigate", "Open Site Visits", "/vayon/site-visits"),
    ],
    futureTools: ["visit planner"],
  },
  {
    id: "property-matching",
    name: "Property Matching",
    description: "Governed property recommendations.",
    routePrefixes: ["/vayon/property-matching"],
    capabilities: ["recommendation explanation"],
    helpResources: [
      {
        label: "Matching guides",
        href: "/vayon/knowledge/help?q=Property%20Matching",
      },
    ],
    suggestedPrompts: ["Explain match score", "Compare properties"],
    actions: [action("navigate", "Open matching", "/vayon/property-matching")],
    futureTools: ["matching explainer"],
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Measured business intelligence and reports.",
    routePrefixes: ["/vayon/analytics"],
    capabilities: ["metric explanation"],
    helpResources: [
      { label: "Analytics guides", href: "/vayon/knowledge/help?q=Analytics" },
    ],
    suggestedPrompts: ["Explain this metric", "Open sales report"],
    actions: [action("navigate", "Open Analytics", "/vayon/analytics")],
    futureTools: ["report explainer"],
  },
  {
    id: "platform",
    name: "Vayon",
    description: "Global product and administration guidance.",
    routePrefixes: ["/vayon"],
    capabilities: ["navigation", "help search"],
    helpResources: [
      { label: "Help Center", href: "/vayon/knowledge/help" },
      { label: "Documentation", href: "/docs" },
      { label: "Release notes", href: "/docs/release-notes" },
    ],
    suggestedPrompts: ["Show documentation", "Help me get started"],
    actions: [
      action("show_documentation", "Open Help Center", "/vayon/knowledge/help"),
    ],
    futureTools: ["success copilot"],
  },
];
export const intelligenceModuleRegistry = Object.freeze(modules);
export function moduleForRoute(route: string) {
  return (
    modules.find((entry) =>
      entry.routePrefixes.some((prefix) => route.startsWith(prefix)),
    ) ?? modules.at(-1)!
  );
}
export function pageContext(
  route: string,
  identity: {
    organization: string;
    workspace: string;
    user: string;
    role: string;
    subscriptionPlan?: string;
  },
): PageIntelligenceContext {
  const intelligenceModule = moduleForRoute(route),
    segments = route.split("/").filter(Boolean);
  return Object.freeze({
    route,
    moduleId: intelligenceModule.id,
    moduleName: intelligenceModule.name,
    page: segments.at(-1) ?? "home",
    organization: identity.organization,
    workspace: identity.workspace,
    user: identity.user,
    role: identity.role,
    subscriptionPlan: identity.subscriptionPlan ?? "Unavailable",
    feature: intelligenceModule.id,
    selectedRecord: segments.length > 3 ? (segments.at(-1) ?? null) : null,
    workflow:
      route.startsWith("/vayon/workflows/") && segments.at(-1) !== "workflows"
        ? (segments.at(-1) ?? null)
        : null,
  });
}
