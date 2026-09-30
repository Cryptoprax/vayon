import type { ApprovalEvent, ApprovalRecord, RequestApprovalInput } from "../domain/approval";

export interface ApprovalRepository {
  list(): Promise<readonly ApprovalRecord[]>;
  get(id: string): Promise<ApprovalRecord | null>;
  events(approvalId: string): Promise<readonly ApprovalEvent[]>;
  request(input: RequestApprovalInput): Promise<string>;
  decide(id: string, expectedVersion: number, decision: "approved" | "rejected", reason?: string): Promise<void>;
  cancel(id: string, expectedVersion: number): Promise<void>;
}
