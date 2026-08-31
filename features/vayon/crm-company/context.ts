import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CurrentContext = {
  organization_id: string;
  workspace_id: string;
};

type Membership = CurrentContext & {
  id: string;
  roles: { code: string } | null;
};

export async function crmTenantContext() {
  const client = await createSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { data: selected, error: contextError } = await client
    .from("user_organization_context")
    .select("organization_id,workspace_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (contextError) throw contextError;

  const current = selected as CurrentContext | null;
  let membershipQuery = client
    .from("workspace_members")
    .select("id,organization_id,workspace_id,roles(code)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (current) {
    membershipQuery = membershipQuery
      .eq("organization_id", current.organization_id)
      .eq("workspace_id", current.workspace_id);
  }
  const { data, error: membershipError } = await membershipQuery.limit(1).maybeSingle();
  if (membershipError) throw membershipError;
  const membership = data as unknown as Membership | null;
  if (!membership) throw new Error("An active workspace membership is required.");

  return {
    client,
    organizationId: membership.organization_id,
    workspaceId: membership.workspace_id,
    membershipId: membership.id,
    role: membership.roles?.code ?? "member",
  };
}
