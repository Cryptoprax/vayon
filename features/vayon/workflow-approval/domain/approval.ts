/**
 * Real, persistent, tenant-scoped Business+ Approval Workflows domain model.
 * Distinct from ./models.ts, which backs the pre-existing demo/test-only
 * in-memory governance scaffold (InMemoryGovernanceRepository, ApprovalEngine,
 * WorkflowEngine, ExecutionEngine) -- that scaffold has no persistence, no
 * tenant scoping, and no live mutation path, and is retained only for
 * demo/test use, not customer production traffic.
 *
 * source_type/source_id/action_type/payload are deliberately generic (not
 * provider-specific columns) so a future producer -- an AI employee, Marketing
 * AI, Creative Studio, WhatsApp AI, or the workflow automation engine -- can
 * create an approval request without a schema change.
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export interface ApprovalRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly sourceType: string;
  readonly sourceId: string | null;
  readonly actionType: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly status: ApprovalStatus;
  readonly requestedBy: string;
  readonly approverId: string | null;
  readonly reason: string | null;
  readonly requestedAt: string;
  readonly decidedAt: string | null;
  readonly version: number;
}

export interface ApprovalEvent {
  readonly id: string;
  readonly approvalId: string;
  readonly event: string;
  readonly actorId: string;
  readonly occurredAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RequestApprovalInput {
  readonly sourceType: string;
  readonly sourceId?: string;
  readonly actionType: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}
