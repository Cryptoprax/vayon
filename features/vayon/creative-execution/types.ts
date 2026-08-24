import type {
  CreativeAssetOutput,
  CreativeRuntimeRequest,
} from "@/features/vayon/creative-runtime/types";
export type ExecutionCapability =
  | "Document"
  | "Image"
  | "Video"
  | "Voice"
  | "Presentation"
  | "Website"
  | "Translation";
export type ExecutionJobState =
  | "Queued"
  | "Planning"
  | "WaitingProvider"
  | "Executing"
  | "WaitingApproval"
  | "Completed"
  | "Failed"
  | "Cancelled";
export type ExecutionEventType =
  | "Queued"
  | "Started"
  | "Completed"
  | "Failed"
  | "Retry"
  | "Cancelled"
  | "ApprovalRequested";
export interface ExecutionJob {
  readonly id: string;
  readonly workspaceId: string;
  readonly organizationId: string;
  readonly request: CreativeRuntimeRequest;
  readonly capability: ExecutionCapability;
  readonly state: ExecutionJobState;
  readonly priority: "low" | "normal" | "high" | "critical";
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly timeoutMs: number;
  readonly cancellationRequested: boolean;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface ExecutionPlan {
  readonly jobId: string;
  readonly capability: ExecutionCapability;
  readonly providerIds: readonly string[];
  readonly selectedProviderId: string | null;
  readonly fallbackProviderIds: readonly string[];
  readonly dependencies: readonly string[];
  readonly executionOrder: readonly string[];
  readonly valid: boolean;
  readonly reasons: readonly string[];
}
export interface ExecutionMetadata {
  readonly correlationId: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly latencyMs: number | null;
  readonly retries: number;
  readonly estimatedCost: number | null;
  readonly providerModel: string | null;
}
export interface ExecutionResult {
  readonly jobId: string;
  readonly status:
    | "WaitingProvider"
    | "WaitingApproval"
    | "Completed"
    | "Failed"
    | "Cancelled";
  readonly provider: string | null;
  readonly capability: ExecutionCapability;
  readonly metadata: ExecutionMetadata;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly outputs: readonly CreativeAssetOutput[];
}
export interface ExecutionEvent {
  readonly id: string;
  readonly jobId: string;
  readonly workspaceId: string;
  readonly organizationId: string;
  readonly type: ExecutionEventType;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
}
export interface ExecutionSnapshot {
  readonly adapters: number;
  readonly documentCapability: "Registered";
  readonly providerReadiness: "Unavailable";
  readonly jobs: readonly ExecutionJob[];
  readonly events: readonly ExecutionEvent[];
  readonly metrics: {
    readonly queued: number;
    readonly completed: number;
    readonly retries: number;
    readonly failures: number;
    readonly averageLatencyMs: number | null;
  };
  readonly generatedAt: string;
}
