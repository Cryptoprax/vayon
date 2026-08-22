export const organizationMemoryKeys = [
  "preferred_terminology",
  "frequent_workflows",
  "favorite_reports",
  "frequent_questions",
  "pinned_knowledge",
  "frequent_campaigns",
  "preferred_proposal_templates",
  "default_property_filters",
  "saved_ai_prompt_templates",
  "support_language",
] as const;
export const userMemoryKeys = [
  "favorite_dashboards",
  "recent_searches",
  "pinned_projects",
  "frequent_ai_prompts",
  "preferred_layouts",
  "notification_preferences",
  "assistant_preferences",
] as const;
export type OrganizationMemoryKey = (typeof organizationMemoryKeys)[number];
export type UserMemoryKey = (typeof userMemoryKeys)[number];
export interface MemoryPreference {
  readonly scope: "organization" | "user";
  readonly key: OrganizationMemoryKey | UserMemoryKey;
  readonly value: readonly string[];
  readonly updatedAt: string;
}
export interface TrendMetric {
  readonly id: string;
  readonly label: string;
  readonly value: number | null;
  readonly weeklyChange: number | null;
  readonly monthlyChange: number | null;
  readonly evidence: string;
}
export interface LearningRecommendation {
  readonly id: string;
  readonly kind:
    | "update_article"
    | "create_faq"
    | "record_tutorial"
    | "improve_onboarding"
    | "improve_workflow"
    | "improve_documentation";
  readonly title: string;
  readonly rationale: string;
  readonly recommendationOnly: true;
  readonly executionAllowed: false;
}
export interface ExecutiveBriefing {
  readonly id: string;
  readonly period:
    | "weekly"
    | "monthly"
    | "quarterly"
    | "customer_success"
    | "ai_adoption"
    | "knowledge_health";
  readonly summary: string;
  readonly source: "openai" | "deterministic-rules";
  readonly model: string | null;
  readonly generatedAt: string;
  readonly aiGenerated: boolean;
  readonly recommendationOnly: true;
}
export interface ContinuousLearningSnapshot {
  readonly organizationMemory: readonly MemoryPreference[];
  readonly userMemory: readonly MemoryPreference[];
  readonly executiveMetrics: readonly TrendMetric[];
  readonly qualityMetrics: readonly TrendMetric[];
  readonly repeatedQuestions: readonly { label: string; count: number }[];
  readonly successfulWorkflows: readonly { label: string; count: number }[];
  readonly unusedCapabilities: readonly string[];
  readonly recommendations: readonly LearningRecommendation[];
  readonly briefings: readonly ExecutiveBriefing[];
  readonly generatedAt: string;
}
export interface ContinuousLearningRepository {
  snapshot(userId: string): Promise<ContinuousLearningSnapshot>;
  remember(
    scope: "organization" | "user",
    key: string,
    value: readonly string[],
  ): Promise<void>;
  saveBriefing(
    input: Omit<ExecutiveBriefing, "id" | "generatedAt">,
  ): Promise<void>;
}
