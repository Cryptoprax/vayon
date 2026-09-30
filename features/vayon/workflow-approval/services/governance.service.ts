import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import type { ApprovalRepository } from "../contracts/approval-repository";
import type { RequestApprovalInput } from "../domain/approval";
import { InMemoryApprovalRepository } from "../repositories/in-memory-approval.repository";
import { SupabaseApprovalRepository } from "../repositories/supabase-approval.repository";

/**
 * Real, tenant-scoped Business+ Approval Workflows service. production()
 * derives scope exclusively from the caller's own session via
 * operationsContext() -- never from client-supplied IDs -- and never falls
 * back to in-memory storage. demo() exists only for explicit demo/test use
 * and must never be reachable from a customer production route.
 *
 * This replaces the previous GovernanceService, which was hardwired to a
 * module-level InMemoryGovernanceRepository singleton shared across every
 * organization with no live mutation path. That scaffold (GovernanceRepository,
 * InMemoryGovernanceRepository, ApprovalEngine/WorkflowEngine/ExecutionEngine,
 * the domain types in ../domain/models.ts) is left in place, unreferenced by
 * any customer route, for possible future workflow-template-builder use --
 * see the Phase D1 approval-workflows report for the full rationale.
 */
export class GovernanceService {
  constructor(private repository: ApprovalRepository) {}

  static async production() {
    const c = await operationsContext();
    return new GovernanceService(new SupabaseApprovalRepository(c.client, c.organizationId, c.workspaceId));
  }

  static demo() {
    return new GovernanceService(new InMemoryApprovalRepository());
  }

  approvals() {
    return this.repository.list();
  }

  async approval(id: string) {
    const [approval, events] = await Promise.all([this.repository.get(id), this.repository.events(id)]);
    return { approval, events };
  }

  requestApproval(input: RequestApprovalInput) {
    return this.repository.request(input);
  }

  decideApproval(id: string, expectedVersion: number, decision: "approved" | "rejected", reason?: string) {
    return this.repository.decide(id, expectedVersion, decision, reason);
  }

  cancelApproval(id: string, expectedVersion: number) {
    return this.repository.cancel(id, expectedVersion);
  }
}
