import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestAuthUser, requestMemo } from "@/lib/supabase/request-identity";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import type { PlatformVisibilityContext } from "./domain";
import { normalizeVisibilityRole } from "./policy";
import { PlatformVisibilityRepository } from "./repository";

// Request-scoped (see requestMemo): the user and permission context are the request's shared lookups.
const visibilityContext = requestMemo<PlatformVisibilityContext>(async () => {
  const [user, workspace] = await Promise.all([
    requestAuthUser(), new WorkspacePermissionService().context().catch(() => null),
  ]);
  const platformRole = user?.app_metadata?.role;
  const role = normalizeVisibilityRole(platformRole, workspace?.role);
  const founder = role === "Founder" || role === "Super Admin";
  const industry = workspace ? await new PlatformVisibilityRepository(await createSupabaseServerClient()).workspaceIndustry(workspace.workspaceId) : "REAL_ESTATE";
  return { role, founder, industry };
});

export class PlatformVisibilityService {
  async context(): Promise<PlatformVisibilityContext> {
    return (await visibilityContext())!;
  }
}
