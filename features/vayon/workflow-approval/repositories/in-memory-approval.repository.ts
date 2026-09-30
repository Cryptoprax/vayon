import { randomUUID } from "node:crypto";
import type { ApprovalRepository } from "../contracts/approval-repository";
import type { ApprovalEvent, ApprovalRecord, RequestApprovalInput } from "../domain/approval";

/**
 * Explicitly demo/test-only. Never constructed from operationsContext(), and
 * never reachable from a customer production route -- GovernanceService.
 * production() always uses SupabaseApprovalRepository.
 */
export class InMemoryApprovalRepository implements ApprovalRepository {
  private records = new Map<string, ApprovalRecord>();
  private eventLog: ApprovalEvent[] = [];

  async list() {
    return [...this.records.values()];
  }
  async get(id: string) {
    return this.records.get(id) ?? null;
  }
  async events(approvalId: string) {
    return this.eventLog.filter((item) => item.approvalId === approvalId);
  }
  async request(input: RequestApprovalInput) {
    const id = randomUUID(), now = new Date().toISOString();
    this.records.set(id, {
      id, organizationId: "demo-org", workspaceId: "demo-workspace",
      sourceType: input.sourceType, sourceId: input.sourceId ?? null, actionType: input.actionType,
      payload: input.payload ?? {}, status: "pending", requestedBy: "demo-user",
      approverId: null, reason: null, requestedAt: now, decidedAt: null, version: 1,
    });
    this.eventLog.push({ id: randomUUID(), approvalId: id, event: "approval.requested", actorId: "demo-user", occurredAt: now, metadata: {} });
    return id;
  }
  async decide(id: string, expectedVersion: number, decision: "approved" | "rejected", reason?: string) {
    const current = this.records.get(id);
    if (!current || current.version !== expectedVersion || current.status !== "pending") throw new Error("Approval is not pending.");
    const now = new Date().toISOString();
    this.records.set(id, { ...current, status: decision, approverId: "demo-approver", reason: reason ?? null, decidedAt: now, version: current.version + 1 });
    this.eventLog.push({ id: randomUUID(), approvalId: id, event: `approval.${decision}`, actorId: "demo-approver", occurredAt: now, metadata: { reason } });
  }
  async cancel(id: string, expectedVersion: number) {
    const current = this.records.get(id);
    if (!current || current.version !== expectedVersion || current.status !== "pending") throw new Error("Approval is not pending.");
    const now = new Date().toISOString();
    this.records.set(id, { ...current, status: "cancelled", version: current.version + 1 });
    this.eventLog.push({ id: randomUUID(), approvalId: id, event: "approval.cancelled", actorId: "demo-user", occurredAt: now, metadata: {} });
  }
}
