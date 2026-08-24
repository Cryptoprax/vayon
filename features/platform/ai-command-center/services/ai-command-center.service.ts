import "server-only";
import { AutonomousOperationsService } from "@/features/platform/autonomous-operations/services/autonomous-operations.service";
import { AICollaborationService } from "@/features/platform/ai-collaboration/services/collaboration.service";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { log } from "@/lib/observability/logger";

const directory = [
  {
    id: "executive-ai",
    name: "Founder AI",
    purpose: "Executive coordination and evidence-backed decisions",
    owner: "Founder",
    permissions: ["Executive evidence", "Recommendations", "Approval requests"],
    capabilities: ["Briefings", "Risk detection", "Orchestration"],
  },
  {
    id: "marketing-ai",
    name: "Marketing AI",
    purpose: "Campaign and growth recommendations",
    owner: "Marketing",
    permissions: ["Marketing evidence", "Draft content"],
    capabilities: ["Campaign strategy", "Attribution", "Copy drafts"],
  },
  {
    id: "sales-ai",
    name: "Sales AI",
    purpose: "Pipeline and conversion intelligence",
    owner: "Sales",
    permissions: ["CRM evidence", "Sales recommendations"],
    capabilities: ["Lead scoring", "Forecasting", "Follow-up drafts"],
  },
  {
    id: "customer-success-ai",
    name: "Customer Success AI",
    purpose: "Adoption, retention, and onboarding guidance",
    owner: "Customer Success",
    permissions: ["Customer health evidence", "Recommendations"],
    capabilities: ["Churn risk", "Renewals", "Onboarding"],
  },
  {
    id: "creative-ai",
    name: "Creative AI",
    purpose: "Governed creative recommendations",
    owner: "Marketing",
    permissions: ["Brand kit", "Draft assets"],
    capabilities: ["Creative briefs", "Campaign assets", "Brand review"],
  },
  {
    id: "knowledge-ai",
    name: "Knowledge AI",
    purpose: "Trusted tenant-scoped retrieval",
    owner: "Knowledge",
    permissions: ["Approved knowledge", "Tenant documents"],
    capabilities: ["Retrieval", "Citations", "Help guidance"],
  },
  {
    id: "integration-ai",
    name: "Integration AI",
    purpose: "Provider health and connection diagnostics",
    owner: "Platform",
    permissions: ["Sanitized provider health"],
    capabilities: [
      "Health explanation",
      "Failure diagnosis",
      "Reconnect guidance",
    ],
  },
  {
    id: "workflow-ai",
    name: "Workflow AI",
    purpose: "Governed workflow coordination",
    owner: "Operations",
    permissions: ["Workflow evidence", "Approval state"],
    capabilities: ["Execution planning", "Dependency status", "Retry guidance"],
  },
] as const;

export class AICommandCenterService {
  async snapshot() {
    const started = performance.now(),
      { user } = await founderContext(),
      operations = await new AutonomousOperationsService().snapshot(),
      collaboration = await (
        await AICollaborationService.production()
      )
        .dashboard()
        .catch(() => null),
      providerHealthy = operations.integrations.providers.filter(
        (item) => item.state === "Healthy",
      ),
      pending =
        collaboration?.recommendationPipeline.filter(
          (item) => item.approvalStatus === "pending",
        ) ?? [],
      agents = directory.map((agent) => {
        const aliases =
            agent.id === "customer-success-ai"
              ? ["crm-ai"]
              : agent.id === "creative-ai"
                ? ["marketing-ai"]
                : agent.id === "knowledge-ai"
                  ? ["executive-ai"]
                  : [agent.id],
          recommendations =
            collaboration?.recommendationPipeline.filter((item) =>
              aliases.includes(item.employee),
            ) ?? [],
          tasks = operations.tasks.filter((item) => item.agent === agent.name),
          workflowAgent = agent.id === "workflow-ai",
          integrationAgent = agent.id === "integration-ai",
          health = integrationAgent
            ? providerHealthy.length
              ? "healthy"
              : "warning"
            : workflowAgent
              ? operations.workflows.observability.failed
                ? "warning"
                : "healthy"
              : (operations.statuses.find(
                  (item) => item.name === "AI Workforce",
                )?.state ?? "unavailable"),
          last = collaboration?.timeline.find((item) =>
            aliases.includes(item.agent),
          );
        return {
          ...agent,
          status: tasks.some((item) => item.status === "Running")
            ? ("processing" as const)
            : health === "healthy"
              ? ("online" as const)
              : health === "warning" || health === "risk"
                ? ("error" as const)
                : ("offline" as const),
          objective:
            recommendations[0]?.requestedRecommendation ??
            "Ready for a governed objective",
          runningTasks: tasks.filter((item) => item.status === "Running")
            .length,
          waitingApprovals: recommendations.filter(
            (item) => item.approvalStatus === "pending",
          ).length,
          confidence: average(
            recommendations.flatMap((item) =>
              item.confidence === null ? [] : [item.confidence],
            ),
          ),
          evidence: last?.summary ?? "No recent authorized execution evidence.",
          integrations: integrationAgent
            ? providerHealthy.map((item) => item.name)
            : providerHealthy
                .filter((item) => relevant(agent.id, item.code))
                .map((item) => item.name),
          workload: recommendations.length + tasks.length,
          lastExecution: last?.occurredAt ?? null,
        };
      }),
      decisions = [...operations.priorities]
        .map((item, index) => ({
          ...item,
          urgency:
            item.kind === "risk"
              ? ("critical" as const)
              : index < 3
                ? ("high" as const)
                : ("normal" as const),
          expectedRoi: item.kind === "opportunity" ? item.impact : null,
        }))
        .sort((a, b) => b.impact - a.impact || b.confidence - a.confidence),
      activity = [
        ...(collaboration?.timeline ?? []).map((item) => ({
          id: item.id,
          agent: label(item.agent),
          summary: item.summary,
          occurredAt: item.occurredAt,
          module: "AI Collaboration",
        })),
        ...operations.hub.timeline.map((item) => ({
          id: item.id,
          agent: moduleAgent(item.module),
          summary: item.title,
          occurredAt: item.occurredAt,
          module: item.module,
        })),
      ]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, 100),
      performanceMetrics = {
        tasksCompleted: operations.tasks.filter(
          (item) => item.status === "Completed",
        ).length,
        averageExecutionMs:
          operations.workflows.observability.averageExecutionMs,
        recommendationAcceptance: collaboration?.recommendationPipeline.length
          ? Math.round(
              (collaboration.recommendationPipeline.filter(
                (item) => item.approvalStatus === "approved",
              ).length /
                collaboration.recommendationPipeline.length) *
                100,
            )
          : null,
        workflowSuccess: operations.workflows.observability.successRate,
        providerAvailability: `${providerHealthy.length}/${operations.integrations.providers.length}`,
        executionFailures: operations.workflows.observability.failed,
      };
    log("founder.ai_command_center.viewed", {
      actorId: user.id,
      agents: agents.length,
      recommendations: decisions.length,
      pendingApprovals: pending.length,
      latencyMs: Math.round(performanceNow(started)),
    });
    return {
      operations,
      collaboration,
      agents,
      decisions,
      activity,
      performance: performanceMetrics,
      generatedAt: new Date().toISOString(),
    };
  }
}

function average(values: readonly number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}
function relevant(agent: string, provider: string) {
  return agent === "marketing-ai"
    ? /google|meta|linkedin|email|resend|sendgrid/.test(provider)
    : agent === "sales-ai"
      ? /gmail|calendar|whatsapp|microsoft/.test(provider)
      : agent === "customer-success-ai"
        ? /stripe|razorpay|email/.test(provider)
        : agent === "creative-ai"
          ? /openai/.test(provider)
          : agent === "knowledge-ai"
            ? /openai|microsoft/.test(provider)
            : /openai/.test(provider);
}
function label(code: string) {
  return (
    (
      {
        "executive-ai": "Founder AI",
        "marketing-ai": "Marketing AI",
        "sales-ai": "Sales AI",
        "crm-ai": "Customer Success AI",
        "whatsapp-ai": "Customer Success AI",
        "operations-ai": "Workflow AI",
      } as Record<string, string>
    )[code] ?? code
  );
}
function moduleAgent(module: string) {
  return /marketing|creative/i.test(module)
    ? "Marketing AI"
    : /sales|crm/i.test(module)
      ? "Sales AI"
      : /knowledge/i.test(module)
        ? "Knowledge AI"
        : /workflow/i.test(module)
          ? "Workflow AI"
          : "Founder AI";
}
function performanceNow(started: number) {
  return performance.now() - started;
}
export type AICommandCenterSnapshot = Awaited<
  ReturnType<AICommandCenterService["snapshot"]>
>;
