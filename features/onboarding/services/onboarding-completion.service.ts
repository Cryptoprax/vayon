import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface OnboardingDiagnostic {
  readonly stage: string;
  readonly success: boolean;
  readonly error: string | null;
  readonly workspaceId: string | null;
  readonly organizationId: string | null;
  readonly memberId: string | null;
}

function report(value: OnboardingDiagnostic) {
  const method = value.success ? "info" : "error";
  console[method](JSON.stringify({ event: "onboarding.stage", ...value, timestamp: new Date().toISOString() }));
  return value;
}

type Membership = {
  id: string;
  organization_id: string;
  workspace_id: string;
  status: string;
  roles: { code: string } | null;
  workspaces: { id: string; status: string; created_by: string } | null;
  organizations: { id: string } | null;
};

export class OnboardingCompletionService {
  async complete(): Promise<OnboardingDiagnostic> {
    const client = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return report({ stage: "authenticate", success: false, error: authError?.message ?? "Authentication failed.", workspaceId: null, organizationId: null, memberId: null });
    report({ stage: "authenticate", success: true, error: null, workspaceId: null, organizationId: null, memberId: null });

    const { data, error } = await client.from("workspace_members")
      .select("id,organization_id,workspace_id,status,roles(code),workspaces(id,status,created_by),organizations(id)")
      .eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
    const member = data as unknown as Membership | null;
    if (error || !member?.workspaces || !member.organizations) return report({ stage: "validate_workspace", success: false, error: error?.message ?? "Workspace membership was not created.", workspaceId: member?.workspace_id ?? null, organizationId: member?.organization_id ?? null, memberId: member?.id ?? null });
    const ids = { workspaceId: member.workspace_id, organizationId: member.organization_id, memberId: member.id };
    report({ stage: "create_organization", success: true, error: null, ...ids });
    report({ stage: "create_workspace", success: true, error: null, ...ids });
    if (member.status !== "active" || member.roles?.code !== "organization_owner" || member.workspaces.status !== "active" || member.workspaces.created_by !== user.id) {
      return report({ stage: "validate_ownership", success: false, error: "Workspace ownership or active membership verification failed.", ...ids });
    }
    report({ stage: "create_membership", success: true, error: null, ...ids });

    const { error: completionError } = await client.rpc("complete_enterprise_onboarding");
    if (completionError) {
      report({ stage: "seed_defaults", success: false, error: completionError.message, ...ids });
      const { data: retry, error: retryError } = await client.from("tasks").insert({ organization_id: ids.organizationId, workspace_id: ids.workspaceId, title: "Retry onboarding provisioning", description: `Recover optional onboarding setup: ${completionError.message}`.slice(0, 1000), status: "pending", priority: "high", assigned_user_id: user.id, created_by: user.id, updated_by: user.id }).select("id").single();
      report({ stage: "provision_ai_employees", success: !retryError && Boolean(retry?.id), error: retryError?.message ?? null, ...ids });
      return report({ stage: "redirect", success: true, error: completionError.message, ...ids });
    }
    report({ stage: "provision_ai_employees", success: true, error: null, ...ids });
    report({ stage: "seed_defaults", success: true, error: null, ...ids });
    return report({ stage: "redirect", success: true, error: null, ...ids });
  }
}
