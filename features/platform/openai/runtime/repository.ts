import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIEmployeeCode, CostEstimate, TokenUsage } from "../domain/models";
import type { ConversationSnapshot, PersistedSourceRef, RuntimeUsageSummary, WorkforceConversation, WorkforceMessage } from "./models";

type Context = { client: SupabaseClient; organizationId: string; workspaceId: string };
type Row = Record<string, unknown>;

export class WorkforceConversationRepository {
  constructor(private context: Context) {}

  async search(employee: AIEmployeeCode, query = ""): Promise<readonly WorkforceConversation[]> {
    let request = this.context.client.from("ai_workforce_conversations").select("id,employee_code,title,created_at,updated_at").eq("organization_id", this.context.organizationId).eq("workspace_id", this.context.workspaceId).eq("employee_code", employee).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50);
    if (query.trim()) request = request.ilike("title", `%${query.trim().slice(0, 100)}%`);
    const { data, error } = await request;
    if (error) throw error;
    return ((data ?? []) as Row[]).map((row) => ({ id: String(row.id), employee: String(row.employee_code) as AIEmployeeCode, title: String(row.title), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }));
  }

  async snapshot(employee: AIEmployeeCode, query = ""): Promise<ConversationSnapshot> {
    const conversations = await this.search(employee, query);
    if (!conversations.length) return { conversations, messages: [] };
    const ids = conversations.map((item) => item.id);
    const { data, error } = await this.context.client.from("ai_workforce_messages").select("id,conversation_id,role,content,model,input_tokens,output_tokens,cost_estimate,latency_ms,created_at,source_refs").eq("organization_id", this.context.organizationId).eq("workspace_id", this.context.workspaceId).in("conversation_id", ids).order("created_at");
    if (error) throw error;
    const messages = ((data ?? []) as Row[]).map((row): WorkforceMessage => {
      const input = Number(row.input_tokens ?? 0), output = Number(row.output_tokens ?? 0), model = row.model ? String(row.model) : null, cost = Number(row.cost_estimate ?? 0);
      return { id: String(row.id), conversationId: String(row.conversation_id), role: row.role === "assistant" ? "assistant" : "user", content: String(row.content), model, usage: model ? { promptTokens: input, completionTokens: output, totalTokens: input + output, estimated: false } : null, cost: model ? { model, inputUsd: 0, outputUsd: 0, totalUsd: cost, estimated: true, pricingVersion: "stored-total" } : null, latencyMs: row.latency_ms === null || row.latency_ms === undefined ? null : Number(row.latency_ms), createdAt: String(row.created_at), recommendationOnly: true, ...(Array.isArray(row.source_refs) && row.source_refs.length ? { sourceRefs: row.source_refs as PersistedSourceRef[] } : {}) };
    });
    return { conversations, messages };
  }

  async usageSummary(): Promise<RuntimeUsageSummary> {
    const { data, error } = await this.context.client.from("ai_workforce_messages").select("model,cost_estimate,latency_ms,created_at").eq("organization_id", this.context.organizationId).eq("workspace_id", this.context.workspaceId).eq("role", "assistant").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    const rows = (data ?? []) as Row[], latest = rows[0];
    return { estimatedCost: rows.reduce((total, row) => total + Number(row.cost_estimate ?? 0), 0), lastResponse: latest?.created_at ? String(latest.created_at) : null, latencyMs: latest?.latency_ms === null || latest?.latency_ms === undefined ? null : Number(latest.latency_ms), model: latest?.model ? String(latest.model) : null };
  }

  async create(employee: AIEmployeeCode, title: string) {
    const { data: auth } = await this.context.client.auth.getUser();
    if (!auth.user) throw new Error("Authentication required.");
    const { data, error } = await this.context.client.from("ai_workforce_conversations").insert({ organization_id: this.context.organizationId, workspace_id: this.context.workspaceId, employee_code: employee, title: title.slice(0, 120), created_by: auth.user.id }).select("id").single();
    if (error) throw error;
    return String(data.id);
  }

  async append(input: { conversationId: string; role: "user" | "assistant"; content: string; model?: string; usage?: TokenUsage; cost?: CostEstimate; latencyMs?: number; sourceRefs?: readonly PersistedSourceRef[] }) {
    const { data: auth } = await this.context.client.auth.getUser();
    if (!auth.user) throw new Error("Authentication required.");
    const { error } = await this.context.client.from("ai_workforce_messages").insert({ organization_id: this.context.organizationId, workspace_id: this.context.workspaceId, conversation_id: input.conversationId, role: input.role, content: input.content, model: input.model ?? null, input_tokens: input.usage?.promptTokens ?? 0, output_tokens: input.usage?.completionTokens ?? 0, cost_estimate: input.cost?.totalUsd ?? 0, latency_ms: input.latencyMs ?? null, recommendation_only: true, created_by: auth.user.id, ...(input.sourceRefs?.length ? { source_refs: input.sourceRefs } : {}) });
    if (error) throw error;
    await this.context.client.from("ai_workforce_conversations").update({ updated_at: new Date().toISOString() }).eq("id", input.conversationId).eq("organization_id", this.context.organizationId).eq("workspace_id", this.context.workspaceId);
  }

  /**
   * Trusted (service-role), webhook-safe counterpart to create()/append().
   * These never call auth.getUser() -- there is no browser session in a Meta
   * webhook -- and instead route through the SECURITY DEFINER RPCs added in
   * 20261105000000_ai_workforce_channel_foundation.sql, which derive
   * organization_id and the created_by actor server-side from workspace_id
   * alone. this.context.client must be a service-role client for these to
   * succeed (see trusted-runtime.ts); a cookie-scoped client will be
   * rejected by the RPC's own service_role check.
   */
  async resolveTrustedConversation(input: { employeeCode: AIEmployeeCode; communicationThreadId: string; leadId: string | null }): Promise<string> {
    const { data, error } = await this.context.client.rpc("resolve_whatsapp_ai_conversation", {
      p_workspace_id: this.context.workspaceId,
      p_employee_code: input.employeeCode,
      p_communication_thread_id: input.communicationThreadId,
      p_lead_id: input.leadId,
    });
    if (error) throw error;
    return String(data);
  }

  /**
   * sourceMessageId/deliveryState (Phase E3, 20261106000000_whatsapp_ai_draft_response.sql):
   * when sourceMessageId is supplied, the RPC itself is idempotent per
   * (conversation, sourceMessageId, role) -- a retried append for the same
   * inbound WhatsApp provider message returns the existing row instead of
   * inserting a duplicate. deliveryState defaults to "not_applicable"
   * (matches every pre-E3 trusted append); pass "draft" only for a
   * generated-but-unsent assistant reply.
   */
  async appendTrusted(input: { conversationId: string; role: "user" | "assistant"; content: string; sourceMessageId?: string; deliveryState?: "draft" }): Promise<string> {
    const { data, error } = await this.context.client.rpc("append_trusted_ai_message", {
      p_conversation_id: input.conversationId,
      p_workspace_id: this.context.workspaceId,
      p_role: input.role,
      p_content: input.content,
      p_source_message_id: input.sourceMessageId ?? null,
      p_delivery_state: input.deliveryState ?? "not_applicable",
    });
    if (error) throw error;
    return String(data);
  }

  /**
   * Pre-generation idempotency check (Phase E3): has a draft already been
   * recorded for this provider message? Checked BEFORE invoking the
   * provider, not just at persistence time, so a retried orchestration
   * cannot trigger a second (paid) model call, not merely a second row.
   * Tenant-scoped by organization_id, workspace_id, AND conversation_id, so
   * a source_message_id collision across tenants (which cannot happen
   * anyway, since WhatsApp provider message ids are Meta-global but each
   * conversation is already tenant-scoped) still could not leak across a
   * conversation boundary.
   */
  async findTrustedAssistantDraft(conversationId: string, sourceMessageId: string): Promise<WorkforceMessage | null> {
    const { data, error } = await this.context.client.from("ai_workforce_messages").select("id,conversation_id,role,content,model,input_tokens,output_tokens,cost_estimate,latency_ms,created_at").eq("organization_id", this.context.organizationId).eq("workspace_id", this.context.workspaceId).eq("conversation_id", conversationId).eq("source_message_id", sourceMessageId).eq("role", "assistant").maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Row;
    const input = Number(row.input_tokens ?? 0), output = Number(row.output_tokens ?? 0), model = row.model ? String(row.model) : null, cost = Number(row.cost_estimate ?? 0);
    return { id: String(row.id), conversationId: String(row.conversation_id), role: "assistant", content: String(row.content), model, usage: model ? { promptTokens: input, completionTokens: output, totalTokens: input + output, estimated: false } : null, cost: model ? { model, inputUsd: 0, outputUsd: 0, totalUsd: cost, estimated: true, pricingVersion: "stored-total" } : null, latencyMs: row.latency_ms === null || row.latency_ms === undefined ? null : Number(row.latency_ms), createdAt: String(row.created_at), recommendationOnly: true };
  }

  /**
   * K6 approval-view polish: read back the stable source refs attached to one
   * message, tenant-scoped by organization_id/workspace_id/id. Read-only,
   * used by the human-approval review page so a reviewer can see why a
   * grounded WhatsApp draft said what it said. Returns [] (never throws
   * mid-render) when the row has none or does not belong to this tenant.
   */
  async sourceRefsForMessage(messageId: string): Promise<readonly PersistedSourceRef[]> {
    const { data, error } = await this.context.client
      .from("ai_workforce_messages")
      .select("source_refs")
      .eq("id", messageId)
      .eq("organization_id", this.context.organizationId)
      .eq("workspace_id", this.context.workspaceId)
      .maybeSingle();
    if (error) throw error;
    const refs = (data as Row | null)?.source_refs;
    return Array.isArray(refs) ? (refs as PersistedSourceRef[]) : [];
  }

  /**
   * K6: attach stable source refs (never document text) to a trusted assistant
   * draft after it is persisted. Tenant-scoped by organization, workspace and
   * message id, and restricted to assistant DRAFT rows -- it cannot touch a
   * user message or a sent/other-state row.
   */
  async attachTrustedSourceRefs(messageId: string, sourceRefs: readonly PersistedSourceRef[]): Promise<void> {
    if (!sourceRefs.length) return;
    const { error } = await this.context.client
      .from("ai_workforce_messages")
      .update({ source_refs: sourceRefs })
      .eq("id", messageId)
      .eq("organization_id", this.context.organizationId)
      .eq("workspace_id", this.context.workspaceId)
      .eq("role", "assistant")
      .eq("delivery_state", "draft");
    if (error) throw error;
  }

  /** Tenant-scoped history read for a trusted conversation -- organization_id, workspace_id, and conversation_id are all required, so a raw conversation UUID alone can never cross tenants. */
  async trustedHistory(conversationId: string, limit = 20): Promise<readonly WorkforceMessage[]> {
    const { data, error } = await this.context.client.from("ai_workforce_messages").select("id,conversation_id,role,content,model,input_tokens,output_tokens,cost_estimate,latency_ms,created_at").eq("organization_id", this.context.organizationId).eq("workspace_id", this.context.workspaceId).eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return ((data ?? []) as Row[]).map((row): WorkforceMessage => {
      const input = Number(row.input_tokens ?? 0), output = Number(row.output_tokens ?? 0), model = row.model ? String(row.model) : null, cost = Number(row.cost_estimate ?? 0);
      return { id: String(row.id), conversationId: String(row.conversation_id), role: row.role === "assistant" ? "assistant" : "user", content: String(row.content), model, usage: model ? { promptTokens: input, completionTokens: output, totalTokens: input + output, estimated: false } : null, cost: model ? { model, inputUsd: 0, outputUsd: 0, totalUsd: cost, estimated: true, pricingVersion: "stored-total" } : null, latencyMs: row.latency_ms === null || row.latency_ms === undefined ? null : Number(row.latency_ms), createdAt: String(row.created_at), recommendationOnly: true };
    }).reverse();
  }
}
