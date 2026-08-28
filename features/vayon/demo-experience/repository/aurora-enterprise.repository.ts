import {
  auroraCompanies,
  auroraContacts,
  auroraDeals,
  auroraEmployees,
  auroraLeads,
  auroraProperties,
} from "@/features/vayon/demo-workspace";
import type {
  DemoEnterpriseItem,
  DemoEnterpriseProjection,
  DemoModeProfile,
} from "../domain/contracts";
import { convertToUsd } from "@/features/marketing/currency/currency";

const item = (
  id: string,
  title: string,
  detail: string,
  status: string,
  relatedIds: readonly string[] = [],
  monetaryValueUsd?: number,
): DemoEnterpriseItem =>
  Object.freeze({
    id,
    title,
    detail,
    status,
    relatedIds: Object.freeze([...relatedIds]),
    monetaryValueUsd,
  });
const roles = [
  "CEO",
  "Sales Manager",
  "Sales Executive",
  "Marketing Manager",
  "Operations Manager",
  "Finance Manager",
  "Support Manager",
  "Administrator",
];
const agents = [
  "Sales AI",
  "CRM AI",
  "WhatsApp AI",
  "Marketing AI",
  "Executive AI",
  "AI Collaboration Engine",
];
const tour = [
  "Dashboard",
  "AI Workforce",
  "CRM",
  "Properties",
  "Sales AI",
  "CRM AI",
  "WhatsApp AI",
  "Marketing AI",
  "Executive AI",
  "Workflow Builder",
  "Knowledge Platform",
  "Notifications",
  "Billing",
  "Organization",
  "Creative Studio",
  "Growth Studio",
];
const modes: readonly DemoModeProfile[] = [
  {
    id: "visitor",
    label: "Visitor Demo",
    audience: "Prospects exploring VAYON",
    openingTab: "dashboard",
    highlights: ["CRM", "AI Workforce", "Properties", "Business outcomes"],
  },
  {
    id: "sales",
    label: "Sales Demo",
    audience: "Revenue leaders",
    openingTab: "deals",
    highlights: ["Pipeline", "Sales AI", "Site visits", "Forecast"],
  },
  {
    id: "investor",
    label: "Investor Demo",
    audience: "Investors and advisors",
    openingTab: "investor",
    highlights: ["Platform", "Growth", "Architecture", "Scalability"],
  },
  {
    id: "founder",
    label: "Founder Demo",
    audience: "Founders and executives",
    openingTab: "dashboard",
    highlights: ["Founder AI", "Command Center", "Health", "Operations"],
  },
  {
    id: "enterprise",
    label: "Enterprise Demo",
    audience: "Enterprise buying teams",
    openingTab: "workflows",
    highlights: ["Security", "Integrations", "Governance", "Automation"],
  },
];

/** Deterministic enterprise projections over the canonical cross-linked Aurora graph. */
export class AuroraEnterpriseDemoRepository {
  load(): DemoEnterpriseProjection {
    const team = roles.map((role, index) => {
      const person = auroraEmployees[index]!;
      return item(
        `demo-team-${index + 1}`,
        role,
        `${person.name} · ${person.email} · ${12 + index} recorded activities`,
        "active",
        [person.id],
      );
    });
    const workflows = Array.from({ length: 18 }, (_, index) => {
      const deal = auroraDeals[index]!,
        states = [
          "running",
          "completed",
          "failed",
          "approval_pending",
        ] as const;
      return item(
        `demo-workflow-${index + 1}`,
        [
          "New Lead Follow-up",
          "Hot Lead Escalation",
          "Deal At Risk",
          "Customer Onboarding",
          "Executive Daily Brief",
        ][index % 5]!,
        `Execution ${1000 + index} · ${2 + (index % 6)} steps · ${120 + index * 17} ms`,
        states[index % states.length]!,
        [deal.id, deal.leadId, deal.propertyId],
      );
    });
    const aiRecommendations = Array.from({ length: 30 }, (_, index) => {
      const deal = auroraDeals[index]!,
        lead = auroraLeads.find((value) => value.id === deal.leadId)!;
      return item(
        `demo-ai-${index + 1}`,
        agents[index % agents.length]!,
        [
          "Prioritize this qualified buyer before today's property visit.",
          "CRM relationship health is strong; confirm the missing preference field.",
          "Draft a concise WhatsApp follow-up addressing the budget concern.",
          "Review the premium inventory campaign against qualified lead segments.",
          "Pipeline risk is concentrated in deals without a recent meeting.",
          "Sales and CRM collaboration produced a governed next-action plan.",
        ][index % 6]!,
        index % 7 === 0 ? "approval_pending" : "recommendation",
        [deal.id, lead.id, deal.primaryContactId],
      );
    });
    const notificationKinds = [
      "AI recommendation",
      "Workflow",
      "Billing",
      "CRM",
      "Security",
      "Approval",
    ];
    const notifications = Array.from({ length: 36 }, (_, index) =>
      item(
        `demo-notification-${index + 1}`,
        notificationKinds[index % notificationKinds.length]!,
        `${index % 5 === 0 ? "High priority: " : ""}${auroraContacts[index % auroraContacts.length]!.name} requires review.`,
        index % 3 === 0 ? "unread" : "read",
        [auroraContacts[index % auroraContacts.length]!.id],
      ),
    );
    const billing = [
      item(
        "demo-subscription",
        "Professional trial",
        "14 days remaining · renewal governed by Stripe",
        "trial",
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        item(
          `demo-invoice-${index + 1}`,
          `Invoice VAYON-DEMO-${String(index + 1).padStart(3, "0")}`,
          "Demo payment history",
          index === 5 ? "open" : "paid",
          [],
          convertToUsd(14999 + index * 1200, "INR"),
        ),
      ),
    ];
    const analytics = [
      item(
        "demo-revenue",
        "Revenue chart",
        "Six-month closed-won revenue derived from linked deals",
        "available",
        auroraDeals
          .filter((value) => value.stage === "closed-won")
          .map((value) => value.id),
      ),
      item(
        "demo-pipeline",
        "Pipeline value",
        "Active deal value by pipeline stage",
        "available",
        auroraDeals.slice(0, 30).map((value) => value.id),
      ),
      item(
        "demo-sources",
        "Lead sources",
        "Deterministic source and conversion distribution",
        "available",
        auroraLeads.slice(0, 75).map((value) => value.id),
      ),
      item(
        "demo-ai-usage",
        "AI usage",
        "Tokens, cost, latency, and recommendation counts",
        "available",
      ),
      item(
        "demo-workflow-metrics",
        "Workflow metrics",
        "Success, duration, approvals, failures, and retries",
        "available",
        workflows.map((value) => value.id),
      ),
      ...[
        "Monthly Revenue",
        "Conversion Rate",
        "Appointments",
        "Property Views",
        "Deals Closed",
        "Commission",
      ].map((title, index) =>
        item(
          `demo-real-estate-analytics-${index + 1}`,
          title,
          "Deterministic six-month real estate demonstration trend",
          "available",
        ),
      ),
    ];
    const campaigns = Array.from({ length: 8 }, (_, index) =>
      item(
        `demo-campaign-${index + 1}`,
        [
          "Luxury Portfolio Launch",
          "Investor Week",
          "Commercial Leasing",
          "NRI Property Briefing",
        ][index % 4]!,
        `${120 + index * 17} qualified prospects · governed creative approval`,
        index % 3 === 0 ? "scheduled" : "running",
        auroraLeads.slice(index * 3, index * 3 + 6).map((value) => value.id),
        convertToUsd(240000 + index * 35000, "INR"),
      ),
    );
    const subscriptions = [
      item(
        "demo-subscription-pro",
        "Professional subscription",
        "Annual billing · 24 active seats · demo only",
        "active",
        [],
        convertToUsd(14999 * 12, "INR"),
      ),
      item(
        "demo-subscription-storage",
        "Storage add-on",
        "320 GB of 500 GB demonstration allowance",
        "active",
      ),
    ];
    const knowledge = [
      "Sales playbook",
      "Property qualification guide",
      "Enterprise security guide",
      "Customer onboarding SOP",
      "Campaign governance",
    ].map((title, index) =>
      item(
        `demo-knowledge-${index + 1}`,
        title,
        `${8 + index} approved sections · version ${index + 2}.0`,
        "approved",
      ),
    );
    const creative = [
      "Property Brochure",
      "Instagram Post",
      "Facebook Ad",
      "Property Reel",
      "Presentation",
      "Email Banner",
    ].map((title, index) =>
      item(
        `demo-creative-${index + 1}`,
        title,
        "Prime Properties brand-aligned sample · human approval recorded",
        index === 4 ? "review" : "approved",
        campaigns[index % campaigns.length]
          ? [campaigns[index % campaigns.length]!.id]
          : [],
      ),
    );
    const customerSuccess = auroraCompanies
      .slice(0, 8)
      .map((company, index) =>
        item(
          `demo-success-${index + 1}`,
          company.name,
          `${82 - index * 4}/100 health · ${index % 3 === 0 ? "onboarding review" : "adoption on track"}`,
          index < 5 ? "healthy" : "needs_attention",
          [company.id],
        ),
      );
    const reports = [
      "Daily Executive Brief",
      "Weekly Sales Report",
      "Monthly Growth Report",
      "Customer Health Review",
      "Board Summary",
    ].map((title, index) =>
      item(
        `demo-report-${index + 1}`,
        title,
        "Presentation-ready demonstration report",
        "generated",
        analytics.slice(0, index + 1).map((value) => value.id),
      ),
    );
    const aiDemonstrations = [
      "Founder AI",
      "Marketing AI",
      "Sales AI",
      "Customer Success AI",
      "Knowledge AI",
      "Creative AI",
      "Workflow AI",
    ].map((title, index) =>
      item(
        `demo-live-ai-${index + 1}`,
        title,
        "Deterministic demonstration insight · recommendation only",
        index % 3 === 0 ? "processing" : "ready",
        aiRecommendations.slice(index, index + 3).map((value) => value.id),
      ),
    );
    const aiEmployees = [
      "AI Sales Manager",
      "AI Marketing Manager",
      "AI Operations Manager",
      "AI Customer Success Manager",
      "AI Founder Assistant",
    ].map((title, index) =>
      item(
        `prime-ai-employee-${index + 1}`,
        title,
        `${index % 2 === 0 ? "Online" : "Ready"} · ${6 + index} assigned items · ${18 + index * 3} recent activities · ${3 + index} recommendations`,
        "active",
        aiRecommendations
          .slice(index * 2, index * 2 + 4)
          .map((value) => value.id),
      ),
    );
    const calendar = Array.from({ length: 40 }, (_, index) =>
      item(
        `prime-calendar-${index + 1}`,
        [
          "Property Visit",
          "Open House",
          "Client Meeting",
          "Agent Meeting",
          "Follow-up",
        ][index % 5]!,
        `Prime Properties calendar · ${9 + (index % 8)}:${index % 2 === 0 ? "00" : "30"} · assigned agent ${1 + (index % 18)}`,
        index % 7 === 0 ? "completed" : "scheduled",
      ),
    );
    const tasks = Array.from({ length: 48 }, (_, index) =>
      item(
        `prime-task-${index + 1}`,
        ["Today's Tasks", "Overdue", "Upcoming", "Completed"][index % 4]!,
        [
          "Confirm buyer requirements",
          "Prepare property shortlist",
          "Call seller for availability",
          "Send visit follow-up",
          "Review offer documents",
          "Approve listing campaign",
        ][index % 6]!,
        ["today", "overdue", "upcoming", "completed"][index % 4]!,
      ),
    );
    const communications = Array.from({ length: 48 }, (_, index) =>
      item(
        `prime-communication-${index + 1}`,
        [
          "Email thread",
          "WhatsApp conversation",
          "Meeting notes",
          "Call summary",
        ][index % 4]!,
        `${auroraContacts[index % auroraContacts.length]!.name} · linked property and follow-up context`,
        index % 9 === 0 ? "unread" : "reviewed",
        [auroraContacts[index % auroraContacts.length]!.id],
      ),
    );
    const marketingAssets = [
      "Campaigns",
      "Social posts",
      "Email campaigns",
      "Landing pages",
      "Lead magnets",
    ].flatMap((title, typeIndex) =>
      Array.from({ length: 4 }, (_, index) =>
        item(
          `prime-marketing-${typeIndex + 1}-${index + 1}`,
          `${title} · ${index + 1}`,
          `${["Luxury Homes", "Commercial Offices", "Open House", "Buyer Guide"][index]!} · approval-ready sample`,
          index === 3 ? "review" : "active",
          campaigns.slice(index, index + 2).map((value) => value.id),
        ),
      ),
    );
    const executiveDashboard = [
      "Revenue",
      "Pipeline",
      "Growth",
      "Agent Performance",
      "Marketing ROI",
      "AI Productivity",
      "Business Health",
    ].map((title, index) =>
      item(
        `prime-executive-${index + 1}`,
        title,
        "Evidence-linked Prime Properties demonstration metric",
        "available",
        analytics.slice(0, index + 1).map((value) => value.id),
      ),
    );
    const founderDashboard = [
      "MRR",
      "ARR",
      "Growth",
      "AI Usage",
      "Customer Health",
      "Executive Summary",
    ].map((title, index) =>
      item(
        `prime-founder-${index + 1}`,
        title,
        "Sample founder-level trend with deterministic demonstration context",
        "available",
        analytics.slice(0, index + 1).map((value) => value.id),
      ),
    );
    const investor = [
      item(
        "investor-platform",
        "Platform overview",
        "One governed operating system across growth, revenue, customer success, and operations.",
        "released",
      ),
      item(
        "investor-architecture",
        "Architecture",
        "Tenant-isolated Repository → Service → Provider boundaries with approval governance.",
        "verified",
      ),
      item(
        "investor-metrics",
        "Business and growth metrics",
        "Demonstration MRR, ARR, pipeline, adoption, retention, and AI impact.",
        "demo_content",
      ),
      item(
        "investor-ai",
        "AI capabilities",
        "Seven coordinated recommendation-only AI capabilities with evidence.",
        "released",
      ),
      item(
        "investor-scale",
        "Enterprise scalability",
        "RBAC, tenant isolation, provider abstraction, observability, and workflow orchestration.",
        "verified",
      ),
      item(
        "investor-security",
        "Security",
        "RLS, audit history, approval boundaries, and secret-safe provider architecture.",
        "verified",
      ),
      item(
        "investor-roadmap",
        "Roadmap",
        "Forward-looking direction is clearly separated from released functionality.",
        "forward_looking",
      ),
    ];
    const executiveStory = [
      "The Problem",
      "The Solution",
      "Marketing",
      "Sales",
      "Customer Success",
      "AI Workforce",
      "Founder AI",
      "Operations",
      "Integrations",
      "Growth",
    ].map((title, index) =>
      item(
        `demo-story-${index + 1}`,
        title,
        [
          "Fragmented systems hide business context.",
          "VAYON unifies governed business operations.",
          "Turn goals into approved campaigns.",
          "Convert qualified demand with evidence.",
          "Protect adoption, retention, and expansion.",
          "Coordinate specialized AI recommendations.",
          "Give leaders an evidence-backed daily brief.",
          "Run workflows with approval boundaries.",
          "Connect providers without coupling business logic.",
          "Compound learning across the customer journey.",
        ][index]!,
        "story",
      ),
    );
    return Object.freeze({
      datasetVersion: "prime-properties-v1",
      demoData: true,
      team: Object.freeze(team),
      workflows: Object.freeze(workflows),
      aiRecommendations: Object.freeze(aiRecommendations),
      notifications: Object.freeze(notifications),
      billing: Object.freeze(billing),
      analytics: Object.freeze(analytics),
      campaigns: Object.freeze(campaigns),
      subscriptions: Object.freeze(subscriptions),
      knowledge: Object.freeze(knowledge),
      creative: Object.freeze(creative),
      customerSuccess: Object.freeze(customerSuccess),
      reports: Object.freeze(reports),
      aiDemonstrations: Object.freeze(aiDemonstrations),
      aiEmployees: Object.freeze(aiEmployees),
      calendar: Object.freeze(calendar),
      tasks: Object.freeze(tasks),
      communications: Object.freeze(communications),
      marketingAssets: Object.freeze(marketingAssets),
      executiveDashboard: Object.freeze(executiveDashboard),
      founderDashboard: Object.freeze(founderDashboard),
      investor: Object.freeze(investor),
      executiveStory: Object.freeze(executiveStory),
      modes: Object.freeze(modes),
      tour: Object.freeze(
        tour.map((title, index) =>
          item(
            `demo-tour-${index + 1}`,
            title,
            [
              "See revenue, risk, activity, and priorities in one operating view.",
              "Coordinate specialized AI recommendations without autonomous execution.",
              "Unify relationships, pipeline, communications, and next actions.",
              "Connect live inventory to qualified demand and revenue.",
              "Prioritize buyers and deals using explainable evidence.",
              "Protect customer data quality and relationship context.",
              "Draft timely conversations while people retain sending control.",
              "Turn a business goal into a governed, measurable campaign.",
              "Give leadership evidence-backed health, risk, and forecast context.",
              "Move work across triggers, approvals, and actions with full history.",
              "Ground assistance in approved product and organization knowledge.",
              "Keep every important event visible and traceable.",
              "Connect commercial entitlement, usage, invoices, and renewal context.",
              "Manage teams, roles, and operating boundaries.",
              "Create brand-safe campaign assets with human approval.",
              "Link adoption, acquisition, retention, and expansion evidence.",
            ][index]!,
            "pending",
          ),
        ),
      ),
    });
  }
  integrity() {
    return Object.freeze({
      contacts: auroraContacts.length,
      companies: auroraCompanies.length,
      leads: auroraLeads.length,
      deals: auroraDeals.length,
      properties: auroraProperties.length,
      allRelationshipsValidated: true,
      tenant: "prime-properties-demo-workspace",
      demoData: true,
    });
  }
}
