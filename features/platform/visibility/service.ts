import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import type { PlatformVisibilityContext } from "./domain";
import { normalizeVisibilityRole } from "./policy";
import { PlatformVisibilityRepository } from "./repository";

export class PlatformVisibilityService {
  async context(): Promise<PlatformVisibilityContext> {
    const client = await createSupabaseServerClient();
    const [{ data: { user } }, workspace] = await Promise.all([
      client.auth.getUser(), new WorkspacePermissionService().context().catch(() => null),
    ]);
    const platformRole = user?.app_metadata?.role;
    const role = normalizeVisibilityRole(platformRole, workspace?.role);
    const founder = role === "Founder" || role === "Super Admin";
    const industry = workspace ? await new PlatformVisibilityRepository(client).workspaceIndustry(workspace.workspaceId) : "REAL_ESTATE";
    return { role, founder, industry };
  }
}

