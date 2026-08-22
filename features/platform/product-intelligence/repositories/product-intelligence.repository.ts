import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProductEvent,
  ProductFeedbackInput,
  ProductInsight,
  ProductIntelligenceRepository,
  ProductIntelligenceSnapshot,
  ProductRecommendation,
} from "../contracts";
type Row = Record<string, unknown>;
const insight = (
  id: string,
  category: ProductInsight["category"],
  title: string,
  value: number | null,
  status: ProductInsight["status"],
  evidence: string,
): ProductInsight => ({ id, category, title, value, status, evidence });
export class SupabaseProductIntelligenceRepository implements ProductIntelligenceRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}
  async recordBatch(events: readonly ProductEvent[]) {
    const { error } = await this.client.rpc(
      "record_product_intelligence_events",
      { p_workspace_id: this.workspaceId, p_events: events },
    );
    if (error)
      throw new Error(
        `Product event batch rejected: ${error.code ?? "provider_error"}`,
      );
  }
  async submitFeedback(input: ProductFeedbackInput) {
    const { error } = await this.client.rpc("submit_product_feedback", {
      p_workspace_id: this.workspaceId,
      p_feedback: input,
    });
    if (error)
      throw new Error(
        `Product feedback rejected: ${error.code ?? "provider_error"}`,
      );
  }
  async uploadScreenshot(file: File) {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      throw new Error(
        "Screenshot must be PNG, JPEG, or WebP and no larger than 5 MB.",
      );
    const extension =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg",
      path = `${this.organizationId}/${this.workspaceId}/${crypto.randomUUID()}.${extension}`,
      result = await this.client.storage
        .from("product-feedback")
        .upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) throw new Error("Screenshot upload failed.");
    return path;
  }
  async snapshot(): Promise<ProductIntelligenceSnapshot> {
    const scoped = (table: string) =>
        this.client
          .from(table)
          .select("*")
          .eq("organization_id", this.organizationId)
          .eq("workspace_id", this.workspaceId),
      [eventsResult, feedbackResult, knowledgeResult] = await Promise.all([
        scoped("product_intelligence_events")
          .order("occurred_at", { ascending: false })
          .limit(10000),
        scoped("product_feedback")
          .order("created_at", { ascending: false })
          .limit(2000),
        scoped("knowledge_quality_feedback")
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);
    if (eventsResult.error || feedbackResult.error || knowledgeResult.error)
      throw new Error("Product intelligence evidence unavailable.");
    const events = (eventsResult.data ?? []) as Row[],
      feedback = (feedbackResult.data ?? []) as Row[],
      knowledge = (knowledgeResult.data ?? []) as Row[],
      count = (name: string) =>
        events.filter((row) => row.event_name === name).length,
      modules = group(events.map((row) => String(row.module ?? "unknown"))),
      issues = group(feedback.map((row) => String(row.kind ?? "unknown"))),
      requests = group(
        feedback
          .filter(
            (row) =>
              row.kind === "feature_request" || row.kind === "improvement_idea",
          )
          .map((row) => String(row.title ?? "Request")),
      ),
      questions = group(
        events
          .filter((row) => row.event_name === "search_performed")
          .map((row) => metadataString(row, "topic"))
          .filter((value): value is string => Boolean(value)),
      ),
      failures = events.filter((row) => row.outcome === "failure").length,
      abandoned = events.filter((row) => row.outcome === "abandoned").length,
      longRunning = events.filter(
        (row) => Number(row.duration_ms) > 5000,
      ).length,
      searches = count("search_performed"),
      successfulSearches = events.filter(
        (row) =>
          row.event_name === "search_performed" && row.outcome === "success",
      ).length,
      notHelpful = knowledge.filter((row) => row.rating !== "helpful").length,
      helpful = knowledge.filter((row) => row.rating === "helpful").length,
      accepted = count("ai_suggestion_accepted"),
      dismissed = count("ai_suggestion_dismissed"),
      resolution = count("error_recovered"),
      confidences = events
        .map((row) => metadataNumber(row, "confidence"))
        .filter((value): value is number => value !== null),
      contextRelevant = events.filter(
        (row) => metadataString(row, "contextRelevance") === "relevant",
      ).length,
      contextRated = events.filter((row) =>
        ["relevant", "irrelevant"].includes(
          metadataString(row, "contextRelevance") ?? "",
        ),
      ).length,
      adoption = [
        insight(
          "modules",
          "adoption",
          "Modules adopted",
          modules.length,
          "healthy",
          "Distinct anonymous module activity",
        ),
        insight(
          "onboarding",
          "adoption",
          "Onboarding completion",
          count("feature_opened"),
          count("feature_opened") ? "healthy" : "attention",
          "Observed feature openings",
        ),
      ],
      friction = [
        insight(
          "abandoned",
          "friction",
          "Abandoned workflows",
          abandoned,
          abandoned ? "attention" : "healthy",
          "Explicit abandoned outcomes",
        ),
        insight(
          "failures",
          "friction",
          "Repeated failures",
          failures,
          failures > 1 ? "attention" : "healthy",
          "Anonymous failed outcomes",
        ),
        insight(
          "slow",
          "friction",
          "Long-running tasks",
          longRunning,
          longRunning ? "attention" : "healthy",
          "Durations over 5 seconds",
        ),
      ],
      knowledgeInsights = [
        insight(
          "help",
          "knowledge",
          "Help usage",
          count("knowledge_article_opened"),
          "healthy",
          "Knowledge article events",
        ),
        insight(
          "search",
          "knowledge",
          "Search success",
          searches
            ? Math.round(((searches - notHelpful) / searches) * 100)
            : null,
          searches ? "healthy" : "unavailable",
          "Search and quality feedback evidence",
        ),
        insight(
          "gaps",
          "knowledge",
          "Knowledge gaps",
          notHelpful,
          notHelpful ? "attention" : "healthy",
          "Not helpful, needs update, and problem feedback",
        ),
      ],
      aiQuality = [
        insight(
          "accuracy",
          "ai_quality",
          "Knowledge accuracy",
          helpful + notHelpful
            ? Math.round((helpful / (helpful + notHelpful)) * 100)
            : null,
          helpful + notHelpful ? "healthy" : "unavailable",
          "Helpful versus all knowledge quality ratings",
        ),
        insight(
          "context",
          "ai_quality",
          "Context relevance",
          contextRated
            ? Math.round((contextRelevant / contextRated) * 100)
            : null,
          contextRated ? "healthy" : "unavailable",
          "Anonymous relevant versus irrelevant context ratings",
        ),
        insight(
          "confidence",
          "ai_quality",
          "Answer confidence",
          confidences.length
            ? Math.round(
                confidences.reduce((total, value) => total + value, 0) /
                  confidences.length,
              )
            : null,
          confidences.length ? "healthy" : "unavailable",
          "Average provider confidence when supplied",
        ),
        insight(
          "search-quality",
          "ai_quality",
          "Search success",
          searches ? Math.round((successfulSearches / searches) * 100) : null,
          searches ? "healthy" : "unavailable",
          "Successful anonymous searches versus all searches",
        ),
        insight(
          "acceptance",
          "ai_quality",
          "Suggestion acceptance",
          accepted + dismissed
            ? Math.round((accepted / (accepted + dismissed)) * 100)
            : null,
          accepted + dismissed ? "healthy" : "unavailable",
          "Accepted versus dismissed suggestions",
        ),
        insight(
          "resolution",
          "ai_quality",
          "Resolution rate",
          failures ? Math.round((resolution / failures) * 100) : null,
          failures ? "healthy" : "unavailable",
          "Recovered errors versus failures",
        ),
      ],
      customerHealth = [
        insight(
          "active-modules",
          "customer_health",
          "Active modules",
          modules.length,
          modules.length ? "healthy" : "attention",
          "Distinct modules used in the current evidence window",
        ),
        insight(
          "friction-rate",
          "customer_health",
          "Friction events",
          failures + abandoned,
          failures + abandoned ? "attention" : "healthy",
          "Failed and abandoned anonymous workflows",
        ),
      ],
      recommendations = recommend({
        abandoned,
        failures,
        longRunning,
        notHelpful,
        searches,
      });
    return Object.freeze({
      adoption,
      friction,
      knowledge: knowledgeInsights,
      aiQuality,
      customerHealth,
      topIssues: issues.slice(0, 8),
      trendingRequests: requests.slice(0, 8),
      commonQuestions: questions.slice(0, 8),
      featurePopularity: modules.slice(0, 12),
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  }
}
function metadataString(row: Row, key: string) {
  const metadata = row.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const value = (metadata as Row)[key];
  return typeof value === "string" ? value : null;
}
function metadataNumber(row: Row, key: string) {
  const metadata = row.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const value = (metadata as Row)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function group(values: readonly string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
function recommend(e: {
  abandoned: number;
  failures: number;
  longRunning: number;
  notHelpful: number;
  searches: number;
}): readonly ProductRecommendation[] {
  const result: ProductRecommendation[] = [];
  const add = (
    id: ProductRecommendation["kind"],
    title: string,
    reason: string,
    priority: ProductRecommendation["priority"],
  ) =>
    result.push({
      id,
      kind: id,
      title,
      reason,
      priority,
      recommendationOnly: true,
      executes: false,
    });
  if (e.abandoned)
    add(
      "improve_onboarding",
      "Improve onboarding",
      "Observed abandoned workflows.",
      "high",
    );
  if (e.failures)
    add(
      "improve_workflow",
      "Improve workflow guidance",
      "Repeated failure evidence requires review.",
      "high",
    );
  if (e.longRunning)
    add(
      "create_tutorial",
      "Create a troubleshooting tutorial",
      "Long-running tasks need clearer expectations.",
      "medium",
    );
  if (e.notHelpful)
    add(
      "improve_documentation",
      "Improve documentation",
      "Knowledge quality feedback indicates gaps.",
      "high",
    );
  if (e.searches && e.notHelpful)
    add(
      "create_article",
      "Create a knowledge article",
      "Common searches are not consistently resolved.",
      "medium",
    );
  return Object.freeze(result);
}
