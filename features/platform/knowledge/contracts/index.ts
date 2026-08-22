export type KnowledgeStatus =
  "draft" | "review" | "approved" | "published" | "archived";
export type KnowledgeCategory =
  | "user"
  | "administrator"
  | "ai"
  | "crm"
  | "workflow"
  | "billing"
  | "security"
  | "api"
  | "faq"
  | "release_notes"
  | "tutorial"
  | "organization"
  | "video"
  | "playbook";
export type KnowledgeAuthority =
  | "organization"
  | "approved_knowledge_base"
  | "administrator_guide"
  | "product_documentation"
  | "release_notes"
  | "faq"
  | "ai_reasoning";
export type KnowledgeFeedback =
  "helpful" | "not_helpful" | "needs_update" | "report_problem";
export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: KnowledgeCategory;
  tags: readonly string[];
  status: KnowledgeStatus;
  version: number;
  author: string;
  lastReviewedAt: string | null;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}
export interface KnowledgeDocument {
  id: string;
  name: string;
  mimeType: string;
  category: KnowledgeCategory;
  tags: readonly string[];
  status: KnowledgeStatus;
  version: number;
  author: string;
  lastReviewedAt: string | null;
  createdAt: string;
}
export interface KnowledgeSearchRequest {
  query: string;
  category?: KnowledgeCategory;
  tags?: readonly string[];
  mode: "full_text" | "semantic";
  limit: number;
}
export interface KnowledgeSearchResult {
  id: string;
  title: string;
  summary: string;
  category: KnowledgeCategory;
  tags: readonly string[];
  score: number;
  source: "article" | "document" | "documentation" | "video";
  citation: string;
  authority?: KnowledgeAuthority;
  version?: string;
  module?: string;
  videoUrl?: string | null;
  transcript?: string | null;
  featureKey?: string | null;
  minimumPlan?: string | null;
  deprecated?: boolean;
  upcoming?: boolean;
}
export interface SemanticKnowledgeProvider {
  readonly id: string;
  search(
    request: KnowledgeSearchRequest,
  ): Promise<readonly KnowledgeSearchResult[]>;
}
export interface KnowledgeRetrievalContext {
  module?: string;
  productVersion?: string;
  subscriptionPlan?: string;
  featureAvailable?: boolean;
  permissions?: readonly string[];
}
export interface KnowledgeAnswer {
  answer: string;
  citations: readonly KnowledgeSearchResult[];
  related: readonly KnowledgeSearchResult[];
  video: KnowledgeSearchResult | null;
  suggestedNextStep: string;
  quickActions: readonly { label: string; href: string }[];
  sourcePolicy: "knowledge_first";
  usedGeneralReasoning: boolean;
  escalate: boolean;
  recommendationOnly: true;
  latencyMs: number;
}
