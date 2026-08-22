export const productEventNames = [
  "page_viewed",
  "feature_opened",
  "lead_created",
  "inventory_imported",
  "campaign_generated",
  "proposal_exported",
  "site_visit_booked",
  "report_exported",
  "knowledge_article_opened",
  "quick_action_used",
  "ai_suggestion_accepted",
  "ai_suggestion_dismissed",
  "search_performed",
  "feedback_submitted",
  "error_recovered",
  "retry_completed",
] as const;
export type ProductEventName = (typeof productEventNames)[number];
export interface ProductEvent {
  readonly name: ProductEventName;
  readonly module: string;
  readonly path: string;
  readonly durationMs?: number;
  readonly outcome?: "success" | "failure" | "abandoned";
  readonly anonymousSessionId: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}
export type ProductFeedbackKind =
  | "bug_report"
  | "feature_request"
  | "improvement_idea"
  | "ux_issue"
  | "knowledge_correction"
  | "general_feedback";
export interface ProductFeedbackInput {
  readonly kind: ProductFeedbackKind;
  readonly title: string;
  readonly description: string;
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly rating?: number;
  readonly resolutionQuality?: number;
  readonly screenshotPath?: string;
}
export interface ProductInsight {
  readonly id: string;
  readonly category:
    "adoption" | "friction" | "knowledge" | "ai_quality" | "customer_health";
  readonly title: string;
  readonly value: number | null;
  readonly status: "healthy" | "attention" | "unavailable";
  readonly evidence: string;
}
export interface ProductRecommendation {
  readonly id: string;
  readonly kind:
    | "improve_onboarding"
    | "improve_documentation"
    | "improve_workflow"
    | "create_tutorial"
    | "create_article";
  readonly title: string;
  readonly reason: string;
  readonly priority: "low" | "medium" | "high";
  readonly recommendationOnly: true;
  readonly executes: false;
}
export interface ProductIntelligenceSnapshot {
  readonly adoption: readonly ProductInsight[];
  readonly friction: readonly ProductInsight[];
  readonly knowledge: readonly ProductInsight[];
  readonly aiQuality: readonly ProductInsight[];
  readonly customerHealth: readonly ProductInsight[];
  readonly topIssues: readonly { label: string; count: number }[];
  readonly trendingRequests: readonly { label: string; count: number }[];
  readonly commonQuestions: readonly { label: string; count: number }[];
  readonly featurePopularity: readonly { label: string; count: number }[];
  readonly recommendations: readonly ProductRecommendation[];
  readonly generatedAt: string;
}
export interface ProductIntelligenceRepository {
  recordBatch(events: readonly ProductEvent[]): Promise<void>;
  submitFeedback(input: ProductFeedbackInput): Promise<void>;
  snapshot(): Promise<ProductIntelligenceSnapshot>;
}
