import type {
  BusinessContextEdge,
  BusinessContextNode,
  UnifiedContextGraph,
} from "../contracts";
export class UnifiedContextGraphService {
  build(input: {
    organizationId: string;
    workspaceId: string;
    nodes: readonly BusinessContextNode[];
    unavailableModules: readonly string[];
  }): UnifiedContextGraph {
    const organization = input.nodes.find(
        (node) => node.type === "organization",
      ),
      workspace = input.nodes.find((node) => node.type === "workspace"),
      edges: BusinessContextEdge[] = [];
    for (const node of input.nodes) {
      if (
        workspace &&
        node.id !== workspace.id &&
        node.workspaceId === input.workspaceId
      )
        edges.push({
          id: `${workspace.id}->${node.id}`,
          sourceId: workspace.id,
          targetId: node.id,
          relationship: "workspace_contains",
          evidence: "tenant_membership",
          confidence: 1,
        });
      else if (
        organization &&
        node.id !== organization.id &&
        node.organizationId === input.organizationId
      )
        edges.push({
          id: `${organization.id}->${node.id}`,
          sourceId: organization.id,
          targetId: node.id,
          relationship: "organization_contains",
          evidence: "tenant_membership",
          confidence: 1,
        });
    }
    return Object.freeze({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      nodes: Object.freeze([...input.nodes]),
      edges: Object.freeze(edges),
      unavailableModules: Object.freeze([...input.unavailableModules]),
      generatedAt: new Date().toISOString(),
    });
  }
}
