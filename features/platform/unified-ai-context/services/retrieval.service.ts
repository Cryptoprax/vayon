import type {
  ExplainableContext,
  UnifiedContextGraph,
  UnifiedSearchResult,
} from "../contracts";
const tokens = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((item) => item.length > 1);
export class UnifiedContextRetrievalService {
  retrieve(
    query: string,
    graph: UnifiedContextGraph,
    limit = 24,
  ): ExplainableContext<readonly UnifiedSearchResult[]> {
    const terms = new Set(tokens(query)),
      started = new Date().toISOString(),
      results = graph.nodes
        .map((node) => {
          const haystack = new Set(
              tokens(
                `${node.label} ${node.module} ${node.type} ${node.status ?? ""}`,
              ),
            ),
            score = [...terms].filter((term) => haystack.has(term)).length;
          return {
            id: node.id,
            title: node.label,
            summary: `${node.type.replaceAll("_", " ")} from ${node.module}`,
            module: node.module,
            entityType: node.type,
            score,
            observedAt: node.observedAt,
          };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, Math.min(limit, 50)));
    return {
      result: Object.freeze(results),
      evidence: Object.freeze(
        results.map((item) => ({
          id: item.id,
          label: item.title,
          module: item.module,
        })),
      ),
      relevantEntities: Object.freeze(
        results.map((item) => ({ id: item.id, type: item.entityType })),
      ),
      confidence: results.length
        ? Math.min(0.95, 0.5 + results[0]!.score * 0.1)
        : null,
      memorySources: Object.freeze([
        ...new Set(results.map((item) => item.module)),
      ]),
      generatedAt: started,
      unavailableReason: results.length
        ? null
        : "No authorized tenant evidence matched the query.",
    };
  }
}
