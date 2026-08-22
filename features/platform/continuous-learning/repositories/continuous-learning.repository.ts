import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContinuousLearningRepository,
  ContinuousLearningSnapshot,
  ExecutiveBriefing,
  LearningRecommendation,
  MemoryPreference,
  TrendMetric,
} from "../contracts";

type Row = Record<string, unknown>;
const pct = (current: number, previous: number) =>
  previous ? Math.round(((current - previous) / previous) * 100) : null;
const grouped = (values: readonly string[]) => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
};
const meta = (row: Row, key: string) => {
  const value = row.metadata;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = (value as Row)[key];
  return typeof item === "string" ? item : null;
};

export class SupabaseContinuousLearningRepository implements ContinuousLearningRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}

  async remember(
    scope: "organization" | "user",
    key: string,
    value: readonly string[],
  ) {
    const { error } = await this.client.rpc("upsert_intelligence_memory", {
      p_workspace_id: this.workspaceId,
      p_scope: scope,
      p_key: key,
      p_value: value,
    });
    if (error) throw new Error("Memory preference could not be saved.");
  }

  async saveBriefing(input: Omit<ExecutiveBriefing, "id" | "generatedAt">) {
    const { error } = await this.client.rpc(
      "store_executive_intelligence_briefing",
      {
        p_workspace_id: this.workspaceId,
        p_briefing: input,
      },
    );
    if (error) throw new Error("Executive briefing could not be stored.");
  }

  async snapshot(userId: string): Promise<ContinuousLearningSnapshot> {
    const now = Date.now(),
      week = new Date(now - 7 * 86400000).toISOString(),
      priorWeek = new Date(now - 14 * 86400000).toISOString(),
      month = new Date(now - 30 * 86400000).toISOString(),
      priorMonth = new Date(now - 60 * 86400000).toISOString(),
      scoped = (table: string) =>
        this.client
          .from(table)
          .select("*")
          .eq("organization_id", this.organizationId)
          .eq("workspace_id", this.workspaceId),
      [eventsResult, memoryResult, briefingsResult, knowledgeResult] =
        await Promise.all([
          scoped("product_intelligence_events")
            .gte("occurred_at", priorMonth)
            .order("occurred_at", { ascending: false })
            .limit(20000),
          scoped("intelligence_memory").order("updated_at", {
            ascending: false,
          }),
          scoped("executive_intelligence_briefings")
            .order("generated_at", { ascending: false })
            .limit(12),
          scoped("knowledge_quality_feedback")
            .gte("created_at", priorMonth)
            .limit(5000),
        ]);
    if (
      eventsResult.error ||
      memoryResult.error ||
      briefingsResult.error ||
      knowledgeResult.error
    )
      throw new Error("Continuous learning evidence is unavailable.");
    const events = (eventsResult.data ?? []) as Row[],
      memories = (memoryResult.data ?? []) as Row[],
      briefings = (briefingsResult.data ?? []) as Row[],
      knowledge = (knowledgeResult.data ?? []) as Row[],
      range = (from: string, to?: string) =>
        events.filter((row) => {
          const date = String(row.occurred_at ?? "");
          return date >= from && (!to || date < to);
        }),
      currentWeek = range(week),
      previousWeek = range(priorWeek, week),
      currentMonth = range(month),
      previousMonth = range(priorMonth, month),
      count = (rows: readonly Row[], predicate: (row: Row) => boolean) =>
        rows.filter(predicate).length,
      metric = (
        id: string,
        label: string,
        predicate: (row: Row) => boolean,
        evidence: string,
      ): TrendMetric => ({
        id,
        label,
        value: count(currentMonth, predicate),
        weeklyChange: pct(
          count(currentWeek, predicate),
          count(previousWeek, predicate),
        ),
        monthlyChange: pct(
          count(currentMonth, predicate),
          count(previousMonth, predicate),
        ),
        evidence,
      }),
      successful = (row: Row) => row.outcome === "success",
      aiEvent = (row: Row) =>
        String(row.event_name ?? "").startsWith("ai_suggestion_"),
      executiveMetrics = [
        metric(
          "product",
          "Product adoption",
          successful,
          "Successful anonymous events",
        ),
        metric(
          "ai",
          "AI adoption",
          aiEvent,
          "Accepted and dismissed AI suggestions",
        ),
        metric(
          "features",
          "Feature adoption",
          (row) => row.event_name === "feature_opened",
          "Feature openings",
        ),
        metric(
          "campaigns",
          "Campaign effectiveness",
          (row) => row.event_name === "campaign_generated" && successful(row),
          "Successfully generated campaigns",
        ),
        metric(
          "sales",
          "Sales productivity",
          (row) =>
            ["lead_created", "proposal_exported", "site_visit_booked"].includes(
              String(row.event_name),
            ) && successful(row),
          "Successful sales workflow events",
        ),
        metric(
          "operations",
          "Operational trends",
          (row) =>
            [
              "inventory_imported",
              "report_exported",
              "retry_completed",
            ].includes(String(row.event_name)),
          "Operational workflow events",
        ),
      ],
      helpful = knowledge.filter((row) => row.rating === "helpful").length,
      allKnowledge = knowledge.length,
      accepted = count(
        currentMonth,
        (row) => row.event_name === "ai_suggestion_accepted",
      ),
      dismissed = count(
        currentMonth,
        (row) => row.event_name === "ai_suggestion_dismissed",
      ),
      failures = currentMonth.filter((row) => row.outcome === "failure"),
      resolutions = count(
        currentMonth,
        (row) => row.event_name === "error_recovered",
      ),
      resolutionTimes = currentMonth
        .filter((row) => row.event_name === "error_recovered")
        .map((row) => Number(row.duration_ms))
        .filter(Number.isFinite),
      contextRatings = currentMonth.filter((row) =>
        ["relevant", "irrelevant"].includes(
          meta(row, "contextRelevance") ?? "",
        ),
      ),
      relevantContext = contextRatings.filter(
        (row) => meta(row, "contextRelevance") === "relevant",
      ).length,
      qualityMetrics: TrendMetric[] = [
        {
          id: "accuracy",
          label: "Answer accuracy",
          value: allKnowledge
            ? Math.round((helpful / allKnowledge) * 100)
            : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Helpful knowledge ratings only",
        },
        {
          id: "context",
          label: "Context relevance",
          value: contextRatings.length
            ? Math.round((relevantContext / contextRatings.length) * 100)
            : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Anonymous relevant versus irrelevant context ratings",
        },
        {
          id: "retrieval",
          label: "Retrieval quality",
          value: allKnowledge
            ? Math.round((helpful / allKnowledge) * 100)
            : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Rated retrieval evidence",
        },
        {
          id: "freshness",
          label: "Knowledge freshness",
          value: null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Unavailable until article review evidence exists",
        },
        {
          id: "usefulness",
          label: "Response usefulness",
          value: allKnowledge
            ? Math.round((helpful / allKnowledge) * 100)
            : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Helpful versus all quality ratings",
        },
        {
          id: "resolution",
          label: "Resolution rate",
          value: failures.length
            ? Math.round((resolutions / failures.length) * 100)
            : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Recovered failures",
        },
        {
          id: "time",
          label: "Time to resolution",
          value: resolutionTimes.length
            ? Math.round(
                resolutionTimes.reduce((a, b) => a + b, 0) /
                  resolutionTimes.length,
              )
            : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Average recovery latency in milliseconds",
        },
        {
          id: "acceptance",
          label: "Suggestion acceptance",
          value:
            accepted + dismissed
              ? Math.round((accepted / (accepted + dismissed)) * 100)
              : null,
          weeklyChange: null,
          monthlyChange: null,
          evidence: "Accepted versus rated AI suggestions",
        },
      ],
      questions = grouped(
        currentMonth
          .filter((row) => row.event_name === "search_performed")
          .map((row) => meta(row, "topic"))
          .filter((value): value is string => Boolean(value)),
      ),
      workflows = grouped(
        currentMonth
          .filter(successful)
          .map((row) => String(row.module ?? "unknown")),
      ),
      used = new Set(events.map((row) => String(row.module ?? ""))),
      unusedCapabilities = [
        "crm",
        "inventory",
        "site-visits",
        "marketing",
        "knowledge",
        "workflows",
        "reports",
        "ai-workforce",
      ].filter((item) => !used.has(item)),
      recommendations = buildRecommendations({
        failures: failures.length,
        unhelpful: allKnowledge - helpful,
        questions: questions.length,
        unused: unusedCapabilities.length,
      });
    return {
      organizationMemory: mapMemory(
        memories.filter((row) => row.scope === "organization"),
      ),
      userMemory: mapMemory(
        memories.filter(
          (row) => row.scope === "user" && row.user_id === userId,
        ),
      ),
      executiveMetrics,
      qualityMetrics,
      repeatedQuestions: questions.slice(0, 10),
      successfulWorkflows: workflows.slice(0, 10),
      unusedCapabilities,
      recommendations,
      briefings: briefings.map(mapBriefing),
      generatedAt: new Date().toISOString(),
    };
  }
}

function mapMemory(rows: readonly Row[]): MemoryPreference[] {
  return rows.map((row) => ({
    scope: row.scope === "user" ? "user" : "organization",
    key: String(row.memory_key) as MemoryPreference["key"],
    value: Array.isArray(row.memory_value) ? row.memory_value.map(String) : [],
    updatedAt: String(row.updated_at),
  }));
}
function mapBriefing(row: Row): ExecutiveBriefing {
  return {
    id: String(row.id),
    period: String(row.period) as ExecutiveBriefing["period"],
    summary: String(row.summary),
    source: row.source === "openai" ? "openai" : "deterministic-rules",
    model: row.model ? String(row.model) : null,
    generatedAt: String(row.generated_at),
    aiGenerated: row.ai_generated === true,
    recommendationOnly: true,
  };
}
function buildRecommendations(input: {
  failures: number;
  unhelpful: number;
  questions: number;
  unused: number;
}): LearningRecommendation[] {
  const result: LearningRecommendation[] = [];
  const add = (
    kind: LearningRecommendation["kind"],
    title: string,
    rationale: string,
  ) =>
    result.push({
      id: kind,
      kind,
      title,
      rationale,
      recommendationOnly: true,
      executionAllowed: false,
    });
  if (input.unhelpful)
    add(
      "update_article",
      "Update low-quality articles",
      "Knowledge feedback indicates content requiring human review.",
    );
  if (input.questions)
    add(
      "create_faq",
      "Create FAQ coverage",
      "Repeated anonymous question topics were observed.",
    );
  if (input.failures)
    add(
      "improve_workflow",
      "Improve workflow recovery",
      "Repeated failed outcomes were observed.",
    );
  if (input.unused)
    add(
      "record_tutorial",
      "Record capability tutorials",
      "Some licensed capabilities have no observed usage.",
    );
  if (input.unused)
    add(
      "improve_onboarding",
      "Improve capability onboarding",
      "Unused capabilities may need contextual onboarding.",
    );
  if (input.unhelpful)
    add(
      "improve_documentation",
      "Improve trusted documentation",
      "Quality evidence shows unresolved knowledge gaps.",
    );
  return result;
}
