export type BusinessEntityType =
  | "organization"
  | "user"
  | "workspace"
  | "property"
  | "project"
  | "lead"
  | "deal"
  | "campaign"
  | "knowledge_article"
  | "creative_asset"
  | "support_ticket"
  | "invoice"
  | "subscription"
  | "meeting"
  | "task"
  | "ai_conversation"
  | "ai_employee"
  | "report";
export interface BusinessContextNode {
  readonly id: string;
  readonly entityId: string;
  readonly type: BusinessEntityType;
  readonly label: string;
  readonly module: string;
  readonly organizationId: string;
  readonly workspaceId: string | null;
  readonly status: string | null;
  readonly observedAt: string | null;
}
export interface BusinessContextEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationship: string;
  readonly evidence: "foreign_key" | "tenant_membership" | "runtime_assignment";
  readonly confidence: number;
}
export interface UnifiedContextGraph {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly nodes: readonly BusinessContextNode[];
  readonly edges: readonly BusinessContextEdge[];
  readonly unavailableModules: readonly string[];
  readonly generatedAt: string;
}
export type MemoryScope =
  "session" | "workspace" | "organization" | "founder" | "module";
export type MemoryDuration = "short_term" | "long_term";
export interface GovernedMemory {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string | null;
  readonly scope: MemoryScope;
  readonly module: string | null;
  readonly content: string;
  readonly duration: MemoryDuration;
  readonly source: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly founderOnly: boolean;
}
export interface MemoryAccessContext {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly actorId: string;
  readonly role: string;
  readonly permissions: readonly string[];
}
export interface MemoryAuditSink {
  record(input: {
    operation: "remember" | "recall" | "forget" | "expire";
    memoryId: string;
    actorId: string;
    organizationId: string;
    workspaceId: string;
    occurredAt: string;
  }): Promise<void>;
}
export interface ExplainableContext<T> {
  readonly result: T;
  readonly evidence: readonly { id: string; label: string; module: string }[];
  readonly relevantEntities: readonly {
    id: string;
    type: BusinessEntityType;
  }[];
  readonly confidence: number | null;
  readonly memorySources: readonly string[];
  readonly generatedAt: string;
  readonly unavailableReason: string | null;
}
export interface UnifiedSearchResult {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly module: string;
  readonly entityType: BusinessEntityType;
  readonly score: number;
  readonly observedAt: string | null;
}
