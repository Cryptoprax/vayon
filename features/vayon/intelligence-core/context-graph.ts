import type { ContextGraph, IntelligenceIntegration } from "./contracts";
import type { KnowledgeRetrievalContext } from "@/features/platform/knowledge/contracts";
import { moduleForRoute, pageContext } from "./module-registry";

export interface ContextGraphIdentity {
  readonly organization: string;
  readonly workspace: string;
  readonly user: string;
  readonly role: string;
  readonly subscriptionPlan?: string;
  readonly permissions?: readonly string[];
  readonly integrations?: readonly IntelligenceIntegration[];
  readonly featureAvailable?: boolean;
}

export function buildContextGraph(
  route: string,
  identity: ContextGraphIdentity,
): ContextGraph {
  const page = pageContext(route, identity),
    registeredModule = moduleForRoute(route);
  return Object.freeze({
    ...page,
    availableActions: registeredModule.actions,
    permissions: Object.freeze([...(identity.permissions ?? [])]),
    integrations: Object.freeze([...(identity.integrations ?? [])]),
    featureAvailable: identity.featureAvailable ?? true,
    generatedAt: new Date().toISOString(),
  });
}

export function safeContextForPrompt(context: ContextGraph) {
  return Object.freeze({
    route: context.route,
    module: context.moduleId,
    page: context.page,
    role: context.role,
    subscriptionPlan: context.subscriptionPlan,
    selectedRecord: context.selectedRecord,
    workflow: context.workflow,
    permissions: context.permissions,
    integrations: context.integrations.map(({ id, state }) => ({ id, state })),
    featureAvailable: context.featureAvailable,
  });
}

export function knowledgeContextFromGraph(
  context: ContextGraph,
  productVersion?: string,
): KnowledgeRetrievalContext {
  return Object.freeze({
    module: context.moduleId,
    productVersion,
    subscriptionPlan: context.subscriptionPlan,
    featureAvailable: context.featureAvailable,
    permissions: context.permissions,
  });
}
