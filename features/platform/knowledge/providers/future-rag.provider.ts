import type {
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  SemanticKnowledgeProvider,
} from "../contracts";
/** Extension point only: Sprint 63 deliberately installs no semantic index. */
export class FutureEnterpriseRagProvider implements SemanticKnowledgeProvider {
  readonly id = "future-enterprise-rag";
  async search(
    request: KnowledgeSearchRequest,
  ): Promise<readonly KnowledgeSearchResult[]> {
    void request;
    return Object.freeze([]);
  }
}
