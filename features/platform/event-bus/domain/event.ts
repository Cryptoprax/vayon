export const eventTypes = [
  "LeadCreated",
  "LeadUpdated",
  "PropertyViewed",
  "PropertyMatched",
  "ConversationReceived",
  "ConversationDrafted",
  "MeetingScheduled",
  "ReminderTriggered",
  "WorkflowSubmitted",
  "WorkflowApproved",
  "WorkflowRejected",
  "DealUpdated",
  "DealClosed",
  "NotificationCreated",
  "AIRecommendationGenerated",
  "ProviderHealthChanged",
  "AnalyticsRefreshed",
  "TaskSuggested",
  "RiskDetected",
  "ApprovalRequested",
  "ApprovalGranted",
  "ApprovalRejected",
  "ExecutionPrepared",
] as const;
export type DomainEventType = (typeof eventTypes)[number];
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: DomainEventType;
  readonly sourceModule: string;
  readonly workspaceId: string;
  readonly organizationId: string;
  readonly correlationId: string;
  readonly actorId?: string;
  readonly timestamp: string;
  readonly payloadMetadata: Readonly<
    Record<string, string | number | boolean | null>
  >;
  readonly evidenceReference?: string;
  readonly severity: "info" | "warning" | "critical";
  readonly visibility: "workspace" | "organization" | "private";
}
export interface EventFilter {
  readonly types?: readonly DomainEventType[];
  readonly sourceModules?: readonly string[];
  readonly severities?: readonly DomainEvent["severity"][];
  readonly correlationId?: string;
  readonly search?: string;
  readonly from?: string;
  readonly to?: string;
}
export interface EventSubscriber {
  readonly id: string;
  readonly eventTypes: readonly DomainEventType[];
  handle(event: DomainEvent): void | Promise<void>;
}
export interface ProductTelemetryPublisher {
  recordBatch(
    events: readonly import("@/features/platform/product-intelligence/contracts").ProductEvent[],
  ): Promise<void>;
}
