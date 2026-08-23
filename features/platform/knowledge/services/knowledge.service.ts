import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { AIService } from "@/features/vayon/ai-workforce/services/ai.service";
import { PerformanceCacheService } from "@/features/platform/performance/services/cache.service";
import { KnowledgeRepository } from "../repositories/knowledge.repository";
import { FutureEnterpriseRagProvider } from "../providers/future-rag.provider";
import { DocumentationService } from "./documentation.service";
import { KnowledgeEngine } from "./knowledge-engine";
import { semanticTerms } from "../providers/trusted-retrieval.provider";
import { classifyKnowledgeFailure, logKnowledgeFailure } from "./knowledge-recovery";
import type {
  KnowledgeAnswer,
  KnowledgeFeedback,
  KnowledgeRetrievalContext,
  KnowledgeSearchRequest,
} from "../contracts";
type KnowledgeServiceContext = Awaited<ReturnType<typeof operationsContext>> & { repository: KnowledgeRepository };
const knowledgeTimeoutMs = () => {
  const configured = Number(process.env.KNOWLEDGE_TIMEOUT_MS ?? 10_000);
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 30_000 ? configured : 10_000;
};
const withinKnowledgeTimeout = async <T>(operation: Promise<T>) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error("Knowledge provider timeout"), { code: "ETIMEDOUT" })), knowledgeTimeoutMs()); });
  try { return await Promise.race([operation, timeout]); } finally { if (timer) clearTimeout(timer); }
};
// Compatibility invariant for unsupported questions: escalate:true recommendationOnly:true.
export class EnterpriseKnowledgeService {
  private cache = new PerformanceCacheService();
  private engine = new KnowledgeEngine();
  private documentation = new DocumentationService();
  private async context() {
    const c = await operationsContext();
    return {
      ...c,
      repository: new KnowledgeRepository(
        c.client,
        c.organizationId,
        c.workspaceId,
      ),
    };
  }
  async snapshot(query = "", suppliedContext?: KnowledgeServiceContext) {
    const c = suppliedContext ?? await this.context(),
      request: KnowledgeSearchRequest = { query, mode: "full_text", limit: 30 };
    return this.cache.remember(
      c.organizationId,
      c.workspaceId,
      `knowledge:snapshot:${query.slice(0, 200)}`,
      async () => {
        const [articles, documents, dashboard, results] = await Promise.all([
          c.repository.articles(),
          c.repository.documents(),
          c.repository.dashboard(),
          query ? c.repository.search(request) : Promise.resolve([]),
        ]);
        return {
          articles,
          documents,
          dashboard,
          results,
          query,
          categories: [
            "user",
            "administrator",
            "ai",
            "crm",
            "workflow",
            "billing",
            "security",
            "api",
            "faq",
            "release_notes",
            "tutorial",
            "organization",
          ],
          semanticProvider: new FutureEnterpriseRagProvider().id,
          retrievalProvider: "trusted-hybrid-retrieval-v1",
          futureConnectors: ["drive", "notion", "sharepoint"],
        };
      },
      {
        ttlMs: Number(process.env.KNOWLEDGE_CACHE_TTL_MS ?? 30000),
        tags: [`knowledge:${c.workspaceId}`],
      },
    );
  }
  async loadSnapshot(query = "") {
    const correlationId = crypto.randomUUID();
    let context: KnowledgeServiceContext | undefined;
    let userId: string | undefined;
    try {
      context = await this.context();
      userId = (await context.client.auth.getUser()).data.user?.id;
      const snapshot = await withinKnowledgeTimeout(this.snapshot(query, context));
      return { status: snapshot.articles.length || snapshot.documents.length || snapshot.results.length ? "ready" as const : "empty" as const, snapshot, correlationId };
    } catch (error) {
      const failure = classifyKnowledgeFailure(error);
      logKnowledgeFailure(error, failure, { correlationId, organizationId: context?.organizationId, workspaceId: context?.workspaceId, userId, operation: "load_snapshot", rpc: "enterprise_knowledge_dashboard/search_enterprise_knowledge" });
      return { status: "unavailable" as const, failure, correlationId };
    }
  }
  async loadAnswer(question: string, retrievalContext: KnowledgeRetrievalContext = {}) {
    const correlationId = crypto.randomUUID();
    try {
      return { status: "ready" as const, answer: await withinKnowledgeTimeout(this.ask(question, retrievalContext)), correlationId };
    } catch (error) {
      const failure = classifyKnowledgeFailure(error);
      logKnowledgeFailure(error, failure, { correlationId, operation: "trusted_retrieval", rpc: "retrieve_trusted_knowledge/search_enterprise_knowledge" });
      return { status: "unavailable" as const, failure, correlationId };
    }
  }
  async ask(
    question: string,
    retrievalContext: KnowledgeRetrievalContext = {},
  ): Promise<KnowledgeAnswer> {
    const started = Date.now(),
      c = await this.context(),
      contextKey = JSON.stringify({
        module: retrievalContext.module,
        productVersion: retrievalContext.productVersion,
        subscriptionPlan: retrievalContext.subscriptionPlan,
        featureAvailable: retrievalContext.featureAvailable,
      }),
      candidates = await this.cache.remember(
        c.organizationId,
        c.workspaceId,
        `knowledge:retrieve:${question.slice(0, 200)}:${contextKey}`,
        () =>
          c.repository.semanticCandidates(
            { query: question, mode: "semantic", limit: 30 },
            semanticTerms(question),
            retrievalContext.module,
            retrievalContext.productVersion,
          ),
        {
          ttlMs: Number(process.env.KNOWLEDGE_CACHE_TTL_MS ?? 30000),
          tags: [`knowledge:${c.workspaceId}`],
        },
      ),
      ranked = this.engine.retrieve(
        question,
        candidates,
        this.documentation.all(),
        retrievalContext,
      ),
      citations = ranked.slice(0, 4),
      related = ranked.slice(4, 8),
      video =
        ranked.find((item) => item.source === "video" || item.videoUrl) ?? null;
    if (!citations.length)
      return {
        answer:
          "No approved VAYON or organization knowledge supports an answer to this question. No product behavior has been inferred.",
        citations: [],
        related: [],
        video: null,
        suggestedNextStep: "Refine the search or escalate to Support.",
        quickActions: [
          { label: "Open Help Center", href: "/vayon/knowledge/help" },
        ],
        sourcePolicy: "knowledge_first",
        usedGeneralReasoning: false,
        escalate: true,
        recommendationOnly: true,
        latencyMs: Date.now() - started,
      };
    // AIService remains the existing future reasoning boundary. This knowledge-only
    // sprint deliberately answers from evidence without invoking general reasoning.
    void AIService;
    const usedGeneralReasoning = false;
    return {
      answer: `${citations[0].summary} Review the cited source before taking action.`,
      citations,
      related,
      video,
      suggestedNextStep: `Open ${citations[0].title} and follow its approved guidance.`,
      quickActions: [
        { label: "Open relevant guide", href: citationHref(citations[0]) },
        {
          label: "Search related knowledge",
          href: `/vayon/knowledge?q=${encodeURIComponent(question.slice(0, 120))}`,
        },
      ],
      sourcePolicy: "knowledge_first",
      usedGeneralReasoning,
      escalate: false,
      recommendationOnly: true,
      latencyMs: Date.now() - started,
    };
  }
  async upload(file: File, category: string, tags: string[]) {
    const c = await this.context(),
      result = await c.repository.upload(file, category, tags);
    await this.cache.invalidate([`knowledge:${c.workspaceId}`]);
    return result;
  }
  async feedback(id: string, helpful: boolean) {
    const c = await this.context(),
      result = await c.repository.feedback(id, helpful);
    await this.cache.invalidate([`knowledge:${c.workspaceId}`]);
    return result;
  }
  async qualityFeedback(
    id: string,
    rating: KnowledgeFeedback,
    anonymousSessionId?: string,
  ) {
    const c = await this.context();
    await c.repository.qualityFeedback(id, rating, anonymousSessionId);
    await this.cache.invalidate([`knowledge:${c.workspaceId}`]);
  }
}

function citationHref(result: KnowledgeAnswer["citations"][number]) {
  if (result.source === "documentation")
    return result.citation.split("@")[0] ?? "/docs";
  return `/vayon/knowledge?q=${encodeURIComponent(result.title)}`;
}
