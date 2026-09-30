import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApprovalRepository } from "../contracts/approval-repository";
import type { ApprovalEvent, ApprovalRecord, ApprovalStatus, RequestApprovalInput } from "../domain/approval";

type Row = Record<string, unknown>;

function toRecord(row: Row): ApprovalRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    workspaceId: String(row.workspace_id),
    sourceType: String(row.source_type),
    sourceId: row.source_id ? String(row.source_id) : null,
    actionType: String(row.action_type),
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: row.status as ApprovalStatus,
    requestedBy: String(row.requested_by),
    approverId: row.approver_id ? String(row.approver_id) : null,
    reason: row.reason ? String(row.reason) : null,
    requestedAt: String(row.requested_at),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
    version: Number(row.version),
  };
}

function toEvent(row: Row): ApprovalEvent {
  return {
    id: String(row.id),
    approvalId: String(row.approval_id),
    event: String(row.event),
    actorId: String(row.actor_id),
    occurredAt: String(row.occurred_at),
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  };
}

/**
 * Tenant-scoped, Supabase-backed approval repository. Every read filters
 * organization_id and workspace_id explicitly -- defense in depth on top of
 * RLS, matching the pattern already used by OrganizationRepository. Writes go
 * exclusively through the request_approval/decide_approval/cancel_approval
 * RPCs (supabase/migrations/20261102000000_business_approval_workflows.sql),
 * which perform their own membership/role/version checks server-side.
 */
export class SupabaseApprovalRepository implements ApprovalRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}

  async list(): Promise<readonly ApprovalRecord[]> {
    const { data, error } = await this.client
      .from("approval_requests")
      .select("id,organization_id,workspace_id,source_type,source_id,action_type,payload,status,requested_by,approver_id,reason,requested_at,decided_at,version")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .order("requested_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toRecord);
  }

  async get(id: string): Promise<ApprovalRecord | null> {
    const { data, error } = await this.client
      .from("approval_requests")
      .select("id,organization_id,workspace_id,source_type,source_id,action_type,payload,status,requested_by,approver_id,reason,requested_at,decided_at,version")
      .eq("id", id)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .maybeSingle();
    if (error) throw error;
    return data ? toRecord(data) : null;
  }

  async events(approvalId: string): Promise<readonly ApprovalEvent[]> {
    const { data, error } = await this.client
      .from("approval_events")
      .select("id,approval_id,event,actor_id,occurred_at,metadata")
      .eq("approval_id", approvalId)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toEvent);
  }

  async request(input: RequestApprovalInput): Promise<string> {
    const { data, error } = await this.client.rpc("request_approval", {
      p_workspace_id: this.workspaceId,
      p_input: { sourceType: input.sourceType, sourceId: input.sourceId ?? null, actionType: input.actionType, payload: input.payload ?? {} },
    });
    if (error) throw error;
    return String(data);
  }

  async decide(id: string, expectedVersion: number, decision: "approved" | "rejected", reason?: string): Promise<void> {
    const { error } = await this.client.rpc("decide_approval", {
      p_approval_id: id,
      p_expected_version: expectedVersion,
      p_decision: decision,
      p_reason: reason ?? null,
    });
    if (error) throw error;
  }

  async cancel(id: string, expectedVersion: number): Promise<void> {
    const { error } = await this.client.rpc("cancel_approval", {
      p_approval_id: id,
      p_expected_version: expectedVersion,
    });
    if (error) throw error;
  }
}
