import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeIndustry } from "./policy";

export class PlatformVisibilityRepository {
  constructor(private readonly client: SupabaseClient) {}

  async workspaceIndustry(workspaceId: string) {
    const { data, error } = await this.client.from("workspace_industry").select("industry").eq("workspace_id", workspaceId).maybeSingle();
    if (error) return "REAL_ESTATE" as const;
    return normalizeIndustry(data?.industry);
  }
}

