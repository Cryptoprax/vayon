import "server-only";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { AICollaborationService } from "@/features/platform/ai-collaboration/services/collaboration.service";
import { EnterpriseIntegrationService } from "@/features/platform/enterprise-integrations/services/enterprise-integration.service";
import { log } from "@/lib/observability/logger";
import type { BusinessContextNode } from "../contracts";
import { UnifiedContextGraphRepository } from "../repositories/context-graph.repository";
import { UnifiedContextGraphService } from "./context-graph.service";
import { UnifiedContextRetrievalService } from "./retrieval.service";
const employees = [
  "Marketing AI",
  "Sales AI",
  "Customer Success AI",
  "Creative AI",
  "Knowledge AI",
  "Founder AI",
] as const;
export class UnifiedAIContextService {
  async snapshot(query: string) {
    const started = performance.now(),
      { user } = await founderContext(),
      context = await operationsContext(),
      repository = new UnifiedContextGraphRepository(
        context.client,
        context.organizationId,
        context.workspaceId,
      ),
      loaded = await repository.nodes(),
      employeeNodes: BusinessContextNode[] = employees.map((label, index) => ({
        id: `ai_employee:${index + 1}`,
        entityId: String(index + 1),
        type: "ai_employee",
        label,
        module: "ai",
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        status: "configured",
        observedAt: null,
      })),
      graph = new UnifiedContextGraphService().build({
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        nodes: [...loaded.nodes, ...employeeNodes],
        unavailableModules: loaded.unavailable,
      }),
      retrieval = new UnifiedContextRetrievalService().retrieve(query, graph),
      [collaboration, integrations] = await Promise.all([
        (await AICollaborationService.production())
          .dashboard()
          .catch(() => ({
            activeCollaborations: 0,
            topContributors: [],
            departmentCollaboration: [],
            recommendationPipeline: [],
            pendingApprovals: 0,
            timeline: [],
            observability: {
              requestCount: 0,
              promptTokens: 0,
              completionTokens: 0,
              averageLatencyMs: null,
              estimatedCost: 0,
              models: [],
              averageConfidence: null,
            },
          })),
        new EnterpriseIntegrationService().snapshot(),
      ]),
      counts = (type: BusinessContextNode["type"]) =>
        graph.nodes.filter((node) => node.type === type).length,
      insights = [
        {
          id: "onboarding-retention",
          statement:
            "Onboarding completion and retention can be compared when both cohort signals are available.",
          classification: "observation" as const,
          evidence: `${counts("subscription")} authorized subscription record(s); onboarding cohort linkage is unavailable.`,
          confidence: null,
        },
        {
          id: "campaign-deal-value",
          statement:
            "Campaign segments and higher-value deals require explicit attribution links before correlation.",
          classification: "observation" as const,
          evidence: `${counts("campaign")} campaign and ${counts("deal")} deal record(s) are available in this tenant graph.`,
          confidence: null,
        },
        {
          id: "feature-expansion",
          statement:
            "Feature adoption and expansion can be correlated only after comparable usage cohorts exist.",
          classification: "observation" as const,
          evidence: `${counts("subscription")} subscription and ${counts("ai_conversation")} AI conversation record(s) are authorized.`,
          confidence: null,
        },
      ],
      providerHealthy = integrations.providers.filter(
        (item) => item.state === "Connected",
      ).length,
      observability = {
        memoryUsage: counts("ai_conversation"),
        retrievalLatencyMs: Math.round(performance.now() - started),
        cacheHitRate: null,
        graphHealth: graph.unavailableModules.length
          ? ("degraded" as const)
          : ("healthy" as const),
        embeddingQueue: process.env.OPENAI_API_KEY
          ? ("not_configured" as const)
          : ("unavailable" as const),
        providerAvailability: `${providerHealthy}/${integrations.providers.length} healthy`,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
      };
    log("founder.unified_ai_context.viewed", {
      actorId: user.id,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      results: retrieval.result.length,
      latencyMs: observability.retrievalLatencyMs,
    });
    return {
      graph,
      retrieval,
      collaboration,
      integrations,
      insights,
      observability,
      memoryScopes: [
        {
          scope: "session",
          duration: "short term",
          retention: "Expires with configured session policy",
        },
        {
          scope: "workspace",
          duration: "long term",
          retention: "Workspace policy and RBAC",
        },
        {
          scope: "organization",
          duration: "long term",
          retention: "Organization policy and RBAC",
        },
        {
          scope: "founder",
          duration: "long term",
          retention: "Founder-only access",
        },
        {
          scope: "module",
          duration: "configurable",
          retention: "Module-specific policy",
        },
      ] as const,
      generatedAt: new Date().toISOString(),
    };
  }
}
export type UnifiedAIContextSnapshot = Awaited<
  ReturnType<UnifiedAIContextService["snapshot"]>
>;
