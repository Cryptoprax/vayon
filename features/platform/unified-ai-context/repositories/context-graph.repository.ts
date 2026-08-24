import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessContextNode, BusinessEntityType } from "../contracts";
const sources = [
  ["organizations", "organization", "Organization", "platform"],
  ["organization_members", "user", "User", "identity"],
  ["workspaces", "workspace", "Workspace", "platform"],
  ["properties", "property", "Property", "inventory"],
  ["property_projects", "project", "Project", "inventory"],
  ["leads", "lead", "Lead", "crm"],
  ["deals", "deal", "Deal", "sales"],
  ["creative_campaigns", "campaign", "Campaign", "marketing"],
  ["knowledge_articles", "knowledge_article", "Knowledge article", "knowledge"],
  ["creative_assets", "creative_asset", "Creative asset", "creative"],
  ["support_tickets", "support_ticket", "Support ticket", "support"],
  ["invoices", "invoice", "Invoice", "billing"],
  ["subscriptions", "subscription", "Subscription", "billing"],
  ["meetings", "meeting", "Meeting", "calendar"],
  ["tasks", "task", "Task", "operations"],
  ["ai_conversations", "ai_conversation", "AI conversation", "ai"],
  ["executive_reports", "report", "Report", "reports"],
] as const satisfies readonly (readonly [
  string,
  BusinessEntityType,
  string,
  string,
])[];
export class UnifiedContextGraphRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly organizationId: string,
    private readonly workspaceId: string,
  ) {}
  async nodes() {
    const settled = await Promise.allSettled(
      sources.map(async ([table, type, fallback, module]) => {
        let query = this.client
          .from(table)
          .select(
            "id,organization_id,workspace_id,status,created_at,updated_at",
          )
          .limit(100);
        if (type === "organization")
          query = query.eq("id", this.organizationId);
        else query = query.eq("organization_id", this.organizationId);
        if (!["organization", "user"].includes(type))
          query = query.eq("workspace_id", this.workspaceId);
        const { data, error } = await query;
        if (error) throw new Error(`${module}:${error.code ?? "unavailable"}`);
        return (data ?? []).map((value) => {
          const row = value as unknown as Record<string, unknown>,
            entityId = String(row.id),
            organizationId =
              type === "organization"
                ? entityId
                : String(row.organization_id ?? this.organizationId),
            workspaceId = row.workspace_id
              ? String(row.workspace_id)
              : type === "workspace"
                ? entityId
                : null;
          return {
            id: `${type}:${entityId}`,
            entityId,
            type,
            label: `${fallback} ${entityId.slice(0, 8)}`,
            module,
            organizationId,
            workspaceId,
            status: row.status ? String(row.status) : null,
            observedAt: row.updated_at
              ? String(row.updated_at)
              : row.created_at
                ? String(row.created_at)
                : null,
          } satisfies BusinessContextNode;
        });
      }),
    );
    const nodes: BusinessContextNode[] = [],
      unavailable: string[] = [];
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") nodes.push(...result.value);
      else unavailable.push(sources[index]![3]);
    });
    return { nodes, unavailable: [...new Set(unavailable)] };
  }
}
