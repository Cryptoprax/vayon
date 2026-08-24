import "server-only";
import { EnterpriseOnboardingService } from "@/features/onboarding/services/enterprise-onboarding.service";
import { EnterpriseOrganizationService } from "@/features/platform/organization/services/organization.service";
import { IntegrationService } from "@/features/platform/integrations/services/integration.service";
import { EnterpriseKnowledgeService } from "@/features/platform/knowledge/services/knowledge.service";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { WorkflowAutomationService } from "@/features/platform/workflows/services/automation.service";
import { SubscriptionService } from "@/features/vayon/billing/services/subscription.service";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { log } from "@/lib/observability/logger";
import { CustomerSuccessWorkspaceRepository } from "../repositories/customer-success.repository";

const tasks = [
  ["organization", "Create organization", 2, "/vayon/settings/organization", 3],
  ["profile", "Complete profile", 3, "/vayon/settings/organization", 4],
  ["team", "Invite teammates", 4, "/vayon/settings/members", 5],
  ["workspace", "Create first workspace", 2, "/vayon/settings/workspace", 4],
  ["contacts", "Import contacts", 9, "/onboarding", 8],
  ["properties", "Import properties", 10, "/onboarding", 10],
  [
    "integrations",
    "Connect integrations",
    5,
    "/vayon/settings/integrations",
    10,
  ],
  ["campaign", "Create first campaign", 8, "/vayon/creative-studio/wizard", 12],
  ["employee", "Create first AI employee", 8, "/vayon/ai/employees", 8],
  ["workflow", "Launch first workflow", 11, "/vayon/workflows", 10],
] as const;

export class CustomerSuccessWorkspaceService {
  async snapshot() {
    const started = performance.now(),
      context = await operationsContext(),
      repository = new CustomerSuccessWorkspaceRepository(
        context.client,
        context.organizationId,
        context.workspaceId,
      ),
      access = await repository.access(),
      [
        evidence,
        onboarding,
        organization,
        workflow,
        integrations,
        runtime,
        knowledge,
        subscription,
      ] = await Promise.all([
        repository.evidence(),
        new EnterpriseOnboardingService().session().catch(() => null),
        new EnterpriseOrganizationService().snapshot().catch(() => null),
        new WorkflowAutomationService().snapshot().catch(() => null),
        new IntegrationService().dashboard().catch(() => null),
        WorkforceRuntimeService.production().catch(() => null),
        new EnterpriseKnowledgeService().loadSnapshot().catch(() => null),
        new SubscriptionService().current().catch(() => null),
      ]),
      completed = new Set(onboarding?.completed_steps ?? []),
      checklist = tasks.map(([id, title, step, href, minutes]) => {
        const direct =
          id === "contacts"
            ? evidence.contacts
            : id === "properties"
              ? evidence.properties
              : id === "campaign"
                ? evidence.campaigns
                : id === "employee"
                  ? evidence.aiConversations
                  : id === "workflow"
                    ? evidence.workflows
                    : null;
        const done = completed.has(step) || (direct !== null && direct > 0);
        return {
          id,
          title,
          step,
          href,
          minutes,
          status: done
            ? ("Completed" as const)
            : onboarding && onboarding.current_step === step
              ? ("In Progress" as const)
              : direct === null &&
                  [
                    "contacts",
                    "properties",
                    "campaign",
                    "employee",
                    "workflow",
                  ].includes(id)
                ? ("Blocked" as const)
                : ("Skipped" as const),
        };
      }),
      completedCount = checklist.filter(
        (item) => item.status === "Completed",
      ).length,
      progress = Math.round((completedCount / checklist.length) * 100),
      runtimeHealth = runtime ? await runtime.health().catch(() => null) : null,
      connected =
        integrations?.connections.filter((item) => item.status === "connected")
          .length ?? 0,
      readiness = [
        integration(
          "Email",
          ["gmail", "outlook", "resend", "sendgrid"],
          integrations,
        ),
        integration(
          "Calendar",
          ["google_calendar", "outlook_calendar"],
          integrations,
        ),
        {
          name: "CRM imports",
          state:
            evidence.contacts === null
              ? "Unavailable"
              : evidence.contacts > 0
                ? "Ready"
                : "Not started",
          guidance: "Import validated contacts from the onboarding wizard.",
        },
        integration("Google", ["gmail", "google_calendar"], integrations),
        integration(
          "Microsoft",
          ["microsoft_365", "microsoft_graph"],
          integrations,
        ),
        integration("Stripe", ["stripe"], integrations),
        integration("Razorpay", ["razorpay"], integrations),
        integration("WhatsApp", ["whatsapp_business"], integrations),
      ],
      milestones = [
        milestone("First Lead Imported", evidence.contacts),
        milestone("First Campaign Created", evidence.campaigns),
        milestone("First AI Conversation", evidence.aiConversations),
        milestone("First Deal Won", evidence.wonDeals),
        milestone("First Workflow Executed", evidence.workflows),
        {
          label: "First Report Generated",
          achieved: null,
          evidence: "A tenant-scoped report-run source is not available.",
        },
      ],
      measured = [
        progress,
        evidence.members === null ? null : Math.min(100, evidence.members * 20),
        runtimeHealth?.connected ? 100 : 0,
        Math.min(100, connected * 20),
      ].filter((value): value is number => value !== null),
      adoption = measured.length
        ? Math.round(
            measured.reduce((sum, value) => sum + value, 0) / measured.length,
          )
        : null,
      recommendations = checklist
        .filter((item) => item.status !== "Completed")
        .slice(0, 4)
        .map((item) => ({
          title: item.title,
          href: item.href,
          evidence: `Onboarding step ${item.step} is ${item.status.toLowerCase()}.`,
          recommendationOnly: true as const,
        }));
    log("customer_success.workspace.viewed", {
      actorId: access.user.id,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      progress,
      latencyMs: Math.round(performance.now() - started),
    });
    return {
      organization: {
        id: context.organizationId,
        name: organization?.profile.name ?? "Organization",
      },
      workspace: {
        id: context.workspaceId,
        name: organization?.profile.name ?? "Workspace",
      },
      user: {
        name: String(
          access.user.user_metadata?.name ??
            access.user.email?.split("@")[0] ??
            "there",
        ),
        role: access.role,
      },
      canConfigureAI: access.canConfigure,
      subscription: subscription
        ? {
            status: subscription.status,
            plan:
              subscription.planName ?? subscription.planCode ?? "Configured",
          }
        : null,
      checklist,
      progress,
      estimatedMinutesRemaining: checklist
        .filter((item) => item.status !== "Completed")
        .reduce((sum, item) => sum + item.minutes, 0),
      milestones,
      readiness,
      health: {
        adoption,
        featureUsage: [
          evidence.contacts,
          evidence.properties,
          evidence.campaigns,
          evidence.aiConversations,
          evidence.workflows,
        ].filter((value) => value !== null && value > 0).length,
        workspaceReadiness: progress,
        teamParticipation:
          evidence.members === null
            ? null
            : Math.min(100, evidence.members * 20),
        evidence: `${evidence.unavailableSources.length} evidence source(s) unavailable; unavailable values are excluded.`,
      },
      team: {
        members: evidence.members,
        activeWorkflows: workflow?.metrics.active ?? null,
        pendingApprovals: workflow?.metrics.pendingApprovals ?? null,
      },
      ai: {
        ready: Boolean(runtimeHealth?.connected),
        health: runtimeHealth,
        conversations: evidence.aiConversations,
      },
      recommendations,
      knowledge:
        knowledge?.status === "ready" || knowledge?.status === "empty"
          ? knowledge.snapshot
          : null,
      generatedAt: new Date().toISOString(),
    };
  }
}

function integration(
  name: string,
  codes: readonly string[],
  dashboard: Awaited<ReturnType<IntegrationService["dashboard"]>> | null,
) {
  const providers =
      dashboard?.providers.filter((item) => codes.includes(item.code)) ?? [],
    providerIds = new Set(providers.map((item) => item.id)),
    connected =
      dashboard?.connections.some(
        (item) =>
          providerIds.has(item.providerId) && item.status === "connected",
      ) ?? false;
  return {
    name,
    state: connected
      ? ("Ready" as const)
      : dashboard
        ? ("Guidance" as const)
        : ("Unavailable" as const),
    guidance: connected
      ? "Connected provider is available in this workspace."
      : "Configure credentials when ready; onboarding can continue without them.",
  };
}

function milestone(label: string, value: number | null) {
  return {
    label,
    achieved: value === null ? null : value > 0,
    evidence:
      value === null
        ? "Evidence source unavailable."
        : `${value} authoritative record(s).`,
  };
}

export type CustomerSuccessWorkspaceSnapshot = Awaited<
  ReturnType<CustomerSuccessWorkspaceService["snapshot"]>
>;
