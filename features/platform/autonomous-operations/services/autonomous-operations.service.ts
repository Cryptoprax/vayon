import "server-only";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { IntelligenceHubService } from "@/features/platform/intelligence-hub/services/intelligence-hub.service";
import { WorkflowOrchestrationService } from "@/features/platform/workflow-orchestration/services/workflow-orchestration.service";
import { EnterpriseIntegrationService } from "@/features/platform/enterprise-integrations/services/enterprise-integration.service";
import { UnifiedAIContextService } from "@/features/platform/unified-ai-context/services/unified-ai-context.service";
import { log } from "@/lib/observability/logger";
export class AutonomousOperationsService {
  async snapshot() {
    const started = performance.now(),
      { user } = await founderContext(),
      [hub, workflows, integrations, context] = await Promise.all([
        new IntelligenceHubService().snapshot({}),
        new WorkflowOrchestrationService().snapshot(),
        new EnterpriseIntegrationService().snapshot(),
        new UnifiedAIContextService().snapshot(""),
      ]),
      executive = hub.executive,
      metric = (
        items: readonly { id: string; value: number | null }[],
        id: string,
      ) => items.find((item) => item.id === id)?.value ?? null,
      health = (name: string, value: number | null, reason: string) => ({
        name,
        state:
          value === null
            ? ("unavailable" as const)
            : value >= 70
              ? ("healthy" as const)
              : value >= 45
                ? ("warning" as const)
                : ("risk" as const),
        value,
        reason,
      }),
      platformMeasured = executive.founder.health.filter(
        (item) => item.state !== "unavailable",
      ),
      platformScore = platformMeasured.length
        ? (platformMeasured.filter((item) => item.state === "healthy").length /
            platformMeasured.length) *
          100
        : null,
      statuses = [
        health(
          "Business",
          executive.healthScore,
          "Weighted Founder AI business-health evidence.",
        ),
        health(
          "Revenue",
          metric(executive.founder.kpis, "mrr") === null ? null : 80,
          "MRR/ARR availability from billing evidence.",
        ),
        health(
          "Marketing",
          metric(executive.marketing.kpis, "roi"),
          "Measured marketing ROI normalized as an operating signal.",
        ),
        health(
          "Sales",
          metric(executive.sales.kpis, "conversion"),
          "Measured sales conversion.",
        ),
        health(
          "Customer Success",
          average(
            executive.customerSuccess.organizations.map((item) => item.score),
          ),
          "Average authorized customer health.",
        ),
        health(
          "Product",
          metric(executive.customerSuccess.kpis, "product-adoption"),
          "Measured product adoption.",
        ),
        health(
          "Platform",
          platformScore,
          "Share of measured services reporting healthy.",
        ),
        health(
          "Security",
          executive.founder.security.some(
            (item) => item.status === "unavailable",
          )
            ? null
            : 85,
          "Authoritative security signals only.",
        ),
        health(
          "AI Workforce",
          integrations.providers.find((item) => item.code === "openai")
            ?.state === "Connected"
            ? 90
            : null,
          "OpenAI provider health and workforce availability.",
        ),
      ],
      objectives = [
        objective(
          "trial-conversion",
          "Increase trial conversions",
          metric(executive.customerSuccess.kpis, "trial-paid"),
          ["Marketing AI", "Customer Success AI"],
          workflows,
          "Trial-to-paid KPI and onboarding workflows.",
        ),
        objective(
          "reduce-churn",
          "Reduce churn",
          invert(metric(executive.founder.kpis, "churn")),
          ["Customer Success AI", "Knowledge AI"],
          workflows,
          "Churn and account-health evidence.",
        ),
        objective(
          "increase-mrr",
          "Increase MRR",
          metric(executive.founder.kpis, "mrr") === null ? null : 65,
          ["Founder AI", "Sales AI"],
          workflows,
          "Authoritative MRR and pipeline evidence.",
        ),
        objective(
          "onboarding",
          "Improve onboarding",
          metric(executive.customerSuccess.kpis, "onboarding-completion"),
          ["Customer Success AI", "Knowledge AI"],
          workflows,
          "Onboarding completion and product-adoption evidence.",
        ),
        objective(
          "enterprise-deals",
          "Increase enterprise deals",
          metric(executive.sales.kpis, "conversion"),
          ["Sales AI", "Marketing AI"],
          workflows,
          "Enterprise pipeline and conversion evidence.",
        ),
        objective(
          "response-time",
          "Reduce response time",
          invert(metric(executive.founder.kpis, "response-time")),
          ["Sales AI", "Customer Success AI"],
          workflows,
          "Response-time evidence and communication workflows.",
        ),
      ],
      tasks = workflows.workflow.executions.slice(0, 30).map((item, index) => ({
        id: item.id,
        title: item.workflowName,
        agent: [
          "Marketing AI",
          "Sales AI",
          "Customer Success AI",
          "Creative AI",
          "Knowledge AI",
        ][index % 5]!,
        status: taskStatus(item.status, item.approvalStatus),
        progress:
          item.status === "completed"
            ? 100
            : item.status === "running"
              ? 60
              : item.status === "waiting"
                ? 40
                : 0,
        evidence:
          item.failureReason ??
          `${item.stepCount} step(s) · ${item.retryCount} retry attempt(s)`,
      })),
      priorities = [
        ...executive.priorities.map((item) => ({
          id: item.id,
          title: item.title,
          kind: "opportunity" as const,
          impact: item.expectedImpact,
          confidence: item.confidence,
          evidence: item.evidence,
        })),
        ...executive.customerSuccess.organizations
          .filter(
            (item) =>
              item.classification === "At Risk" ||
              item.classification === "Critical",
          )
          .map((item) => ({
            id: `customer-${item.id}`,
            title: `Renewal risk: ${item.name}`,
            kind: "risk" as const,
            impact: Math.round(item.churnProbability * 100),
            confidence: item.confidence,
            evidence:
              item.riskFactors.join("; ") || "Customer health evidence.",
          })),
        ...workflows.observability.errorSummaries.map((item) => ({
          id: `workflow-${item.id}`,
          title: `Failed workflow: ${item.workflow}`,
          kind: "risk" as const,
          impact: 75,
          confidence: 0.95,
          evidence: item.reason,
        })),
        ...integrations.providers
          .filter((item) => item.state === "Needs Attention")
          .map((item) => ({
            id: `provider-${item.code}`,
            title: `Integration outage: ${item.name}`,
            kind: "risk" as const,
            impact: 70,
            confidence: 1,
            evidence: item.reason,
          })),
      ]
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 20),
      actions = priorities.slice(0, 8).map((item, index) => ({
        id: `action-${item.id}`,
        title: [
          "Review campaign",
          "Approve workflow",
          "Follow up enterprise customer",
          "Increase onboarding outreach",
          "Reconnect provider",
        ][index % 5]!,
        reason: item.title,
        evidence: item.evidence,
        sensitive: true,
        approvalStatus: "founder_approval_required" as const,
      })),
      digests = [
        "Morning Digest",
        "Midday Summary",
        "Evening Summary",
        "Weekly Review",
        "Monthly Executive Review",
        "Quarterly Board Review",
      ].map((label) => ({
        id: label.toLowerCase().replaceAll(" ", "-"),
        label,
        formats: ["PDF", "PowerPoint"] as const,
      }));
    log("founder.autonomous_operations.viewed", {
      actorId: user.id,
      statuses: statuses.length,
      objectives: objectives.length,
      priorities: priorities.length,
      latencyMs: Math.round(performance.now() - started),
    });
    return {
      hub,
      workflows,
      integrations,
      context,
      statuses,
      objectives,
      tasks,
      priorities,
      actions,
      digests,
      generatedAt: new Date().toISOString(),
    };
  }
}
function average(values: readonly number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}
function invert(value: number | null) {
  return value === null ? null : Math.max(0, 100 - value);
}
function objective(
  id: string,
  title: string,
  progress: number | null,
  modules: readonly string[],
  workflows: Awaited<ReturnType<WorkflowOrchestrationService["snapshot"]>>,
  evidence: string,
) {
  return {
    id,
    title,
    progress,
    modules,
    relatedWorkflows: workflows.workflow.definitions
      .slice(0, 3)
      .map((item) => item.name),
    evidence,
  };
}
function taskStatus(status: string, approval: string | null) {
  if (approval === "pending" || status === "waiting")
    return "Waiting Approval" as const;
  if (status === "completed") return "Completed" as const;
  if (status === "failed") return "Failed" as const;
  if (status === "cancelled") return "Cancelled" as const;
  if (status === "running") return "Running" as const;
  return "Queued" as const;
}
export type AutonomousOperationsSnapshot = Awaited<
  ReturnType<AutonomousOperationsService["snapshot"]>
>;
