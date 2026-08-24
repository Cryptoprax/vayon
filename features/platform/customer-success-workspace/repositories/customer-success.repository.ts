import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export class CustomerSuccessWorkspaceRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly organizationId: string,
    private readonly workspaceId: string,
  ) {}

  async evidence() {
    const scopedCount = (table: string) =>
        this.client
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("organization_id", this.organizationId)
          .eq("workspace_id", this.workspaceId),
      organizationCount = (table: string) =>
        this.client
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("organization_id", this.organizationId),
      results = await Promise.allSettled([
        organizationCount("organization_members").eq("status", "active"),
        scopedCount("contacts").is("deleted_at", null),
        scopedCount("properties").is("deleted_at", null),
        scopedCount("creative_campaigns"),
        scopedCount("ai_workforce_conversations").is("deleted_at", null),
        scopedCount("workflow_instances").eq("status", "completed"),
        scopedCount("deals").eq("status", "won").is("deleted_at", null),
      ]),
      count = (index: number) => {
        const result = results[index];
        return result?.status === "fulfilled" && !result.value.error
          ? (result.value.count ?? 0)
          : null;
      };
    return {
      members: count(0),
      contacts: count(1),
      properties: count(2),
      campaigns: count(3),
      aiConversations: count(4),
      workflows: count(5),
      wonDeals: count(6),
      unavailableSources: results.flatMap((result, index) =>
        result.status === "rejected" || result.value.error ? [index] : [],
      ),
    };
  }

  async access() {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new Error("Authentication required.");
    const { data, error } = await this.client
      .from("workspace_members")
      .select("roles(code)")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    const role =
      (data as unknown as { roles: { code: string } | null } | null)?.roles
        ?.code ?? "";
    if (!role && user.app_metadata?.role !== "super_admin")
      throw new Error("Customer Success Workspace access denied.");
    return {
      user,
      role,
      canConfigure:
        ["organization_owner", "organization_admin", "administrator"].includes(
          role,
        ) || user.app_metadata?.role === "super_admin",
    };
  }
}
