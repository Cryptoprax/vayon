import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIEmployeeCode } from "@/features/platform/openai/domain/models";
import type { CollaborationRepositoryContract } from "../contracts/repository";
import type {
  ApprovalStatus,
  CollaborationDashboard,
  CollaborationEvent,
  CollaborationMemory,
  CollaborationRun,
  RecommendationNode,
} from "../types";
type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v)),
  num = (v: unknown) => Number(v ?? 0) || 0;
export class SupabaseCollaborationRepository implements CollaborationRepositoryContract {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}
  private scoped(table: string, columns = "*") {
    return this.client
      .from(table)
      .select(columns)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId);
  }
  private async user() {
    const { data } = await this.client.auth.getUser();
    if (!data.user) throw new Error("Authentication required.");
    return data.user.id;
  }
  async memory(): Promise<CollaborationMemory> {
    const [
      leads,
      deals,
      properties,
      communications,
      meetings,
      organization,
      recommendations,
      executiveSummaries,
    ] = await Promise.all([
      this.scoped(
        "leads",
        "id,name,email,phone,status,source,priority,budget,last_activity_at,created_at,updated_at",
      )
        .is("deleted_at", null)
        .limit(50),
      this.scoped(
        "deals",
        "id,name,status,stage_id,value,probability,lead_id,property_id,updated_at",
      )
        .is("deleted_at", null)
        .limit(50),
      this.scoped(
        "properties",
        "id,title,status,sale_price,rental_price,city,locality,updated_at",
      )
        .is("deleted_at", null)
        .limit(50),
      this.scoped(
        "communications",
        "id,thread_id,channel,direction,status,occurred_at",
      )
        .is("deleted_at", null)
        .limit(100),
      this.scoped(
        "meetings",
        "id,title,starts_at,status,related_type,related_id",
      )
        .is("deleted_at", null)
        .limit(50),
      this.client
        .from("organizations")
        .select("id,name,business_email,phone,website,timezone,locale,currency")
        .eq("id", this.organizationId)
        .maybeSingle(),
      this.scoped(
        "ai_recommendations",
        "id,employee_id,title,status,confidence,created_at",
      )
        .is("deleted_at", null)
        .limit(100),
      this.scoped(
        "ai_collaboration_recommendations",
        "id,employee_code,request,confidence,approval_status,created_at",
      )
        .eq("employee_code", "executive-ai")
        .limit(30),
    ]);
    for (const result of [
      leads,
      deals,
      properties,
      communications,
      meetings,
      organization,
      recommendations,
      executiveSummaries,
    ])
      if (result.error) throw result.error;
    const leadRows = (leads.data ?? []) as unknown as Row[];
    return {
      customer: leadRows.filter((r) => r.status === "won"),
      leads: leadRows,
      deals: (deals.data ?? []) as unknown as Row[],
      properties: (properties.data ?? []) as unknown as Row[],
      communications: (communications.data ?? []) as unknown as Row[],
      meetings: (meetings.data ?? []) as unknown as Row[],
      organization: organization.data as Row | null,
      recommendations: (recommendations.data ?? []) as unknown as Row[],
      executiveSummaries: (executiveSummaries.data ?? []) as unknown as Row[],
    };
  }
  async createRun(input: {
    scenario: CollaborationRun["scenario"];
    requestedBy: AIEmployeeCode;
    objective: string;
    relatedCustomerId?: string;
  }) {
    const user = await this.user(),
      { data, error } = await this.client
        .from("ai_collaboration_runs")
        .insert({
          organization_id: this.organizationId,
          workspace_id: this.workspaceId,
          scenario: input.scenario,
          requested_by: input.requestedBy,
          objective: input.objective.slice(0, 2000),
          related_customer_id: input.relatedCustomerId ?? null,
          status: "active",
          recommendation_only: true,
          approval_required: true,
          created_by: user,
        })
        .select("id")
        .single();
    if (error) throw error;
    return str(data.id);
  }
  async addEvent(input: {
    runId: string;
    agent: AIEmployeeCode;
    summary: string;
  }) {
    const user = await this.user(),
      { error } = await this.client
        .from("ai_collaboration_events")
        .insert({
          organization_id: this.organizationId,
          workspace_id: this.workspaceId,
          run_id: input.runId,
          employee_code: input.agent,
          summary: input.summary.slice(0, 2000),
          created_by: user,
        });
    if (error) throw error;
  }
  async addRecommendation(input: Omit<RecommendationNode, "id" | "createdAt">) {
    const user = await this.user(),
      { error } = await this.client
        .from("ai_collaboration_recommendations")
        .insert({
          organization_id: this.organizationId,
          workspace_id: this.workspaceId,
          run_id: input.runId,
          employee_code: input.employee,
          request: input.requestedRecommendation,
          provider: input.provider,
          confidence: input.confidence,
          approval_status: input.approvalStatus,
          related_customer_id: input.relatedCustomer,
          prompt_tokens: input.promptTokens,
          completion_tokens: input.completionTokens,
          latency_ms: input.latencyMs,
          estimated_cost: input.estimatedCost,
          model: input.model,
          recommendation_only: true,
          created_by: user,
        });
    if (error) throw error;
  }
  async completeRun(runId: string, status: "completed" | "error") {
    const { error } = await this.client
      .from("ai_collaboration_runs")
      .update({ status, completed_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId);
    if (error) throw error;
  }
  async runs() {
    const { data, error } = await this.scoped("ai_collaboration_runs")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return ((data ?? []) as unknown as Row[]).map((r): CollaborationRun => ({
      id: str(r.id),
      scenario: r.scenario as CollaborationRun["scenario"],
      requestedBy: r.requested_by as AIEmployeeCode,
      status: r.status as CollaborationRun["status"],
      createdAt: str(r.created_at),
    }));
  }
  async events() {
    const { data, error } = await this.scoped("ai_collaboration_events")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return ((data ?? []) as unknown as Row[]).map((r): CollaborationEvent => ({
      id: str(r.id),
      runId: str(r.run_id),
      agent: r.employee_code as AIEmployeeCode,
      summary: str(r.summary),
      occurredAt: str(r.created_at),
    }));
  }
  async dashboard(): Promise<CollaborationDashboard> {
    const [runs, events, recommendations, approvals] = await Promise.all([
      this.runs(),
      this.events(),
      this.scoped("ai_collaboration_recommendations")
        .order("created_at", { ascending: false })
        .limit(200),
      this.scoped("ai_approval_queue").eq("status", "pending").limit(1000),
    ]);
    for (const result of [recommendations, approvals])
      if (result.error) throw result.error;
    const nodes = ((recommendations.data ?? []) as unknown as Row[]).map(
      (r): RecommendationNode => ({
        id: str(r.id),
        runId: str(r.run_id),
        employee: r.employee_code as AIEmployeeCode,
        requestedRecommendation: str(r.request),
        provider: str(r.provider),
        confidence: r.confidence == null ? null : num(r.confidence),
        approvalStatus: r.approval_status as ApprovalStatus,
        relatedCustomer: r.related_customer_id
          ? str(r.related_customer_id)
          : null,
        createdAt: str(r.created_at),
        promptTokens: num(r.prompt_tokens),
        completionTokens: num(r.completion_tokens),
        latencyMs: r.latency_ms == null ? null : num(r.latency_ms),
        estimatedCost: num(r.estimated_cost),
        model: r.model ? str(r.model) : null,
      }),
    );
    const counts = new Map<AIEmployeeCode, number>();
    for (const n of nodes)
      counts.set(n.employee, (counts.get(n.employee) ?? 0) + 1);
    const latencies = nodes.flatMap((n) =>
        n.latencyMs == null ? [] : [n.latencyMs],
      ),
      confidence = nodes.flatMap((n) =>
        n.confidence == null ? [] : [n.confidence],
      );
    return {
      activeCollaborations: runs.filter((r) => r.status === "active").length,
      topContributors: [...counts]
        .map(([agent, requests]) => ({ agent, requests }))
        .sort((a, b) => b.requests - a.requests),
      departmentCollaboration: [...counts].map(([department, requests]) => ({
        department: department.replace("-ai", ""),
        requests,
      })),
      recommendationPipeline: nodes,
      pendingApprovals: (approvals.data ?? []).length,
      timeline: events,
      observability: {
        requestCount: nodes.length,
        promptTokens: nodes.reduce((s, n) => s + n.promptTokens, 0),
        completionTokens: nodes.reduce((s, n) => s + n.completionTokens, 0),
        averageLatencyMs: latencies.length
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : null,
        estimatedCost: nodes.reduce((s, n) => s + n.estimatedCost, 0),
        models: [...new Set(nodes.flatMap((n) => (n.model ? [n.model] : [])))],
        averageConfidence: confidence.length
          ? confidence.reduce((a, b) => a + b, 0) / confidence.length
          : null,
      },
    };
  }
}
