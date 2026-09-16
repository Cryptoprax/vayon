import "server-only";
import { cache } from "react";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { isFounder } from "@/features/platform/founder/services/founder-context";
export interface WorkspaceTrialSnapshot {
  status: string;
  endsAt: string | null;
  source: "vayon3day" | "legacy" | "none";
  redeemedAt: string | null;
  usage: { properties: number | null; leads: number | null; companies: number | null; members: number | null };
}
/** Request-scoped selected-workspace entitlement snapshot shared by shell and billing. */
export const getWorkspaceTrial = cache(async (): Promise<WorkspaceTrialSnapshot | null> => {
  const c = await operationsContext();
  const { data: { user } } = await c.client.auth.getUser();
  if (!user || isFounder(user)) return null;
  const { data, error } = await c.client.from("subscriptions").select("status,trial_ends_at").eq("workspace_id", c.workspaceId).eq("organization_id", c.organizationId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: redemption } = data.status === "trialing" && data.trial_ends_at
    ? await c.client.from("workspace_promo_redemptions").select("redeemed_at,access_ends_at").eq("workspace_id", c.workspaceId).eq("organization_id", c.organizationId).eq("code", "VAYON3DAY").maybeSingle()
    : { data: null };
  const counts = await Promise.all(["properties", "leads", "crm_companies", "workspace_members"].map(async table => {
    let query = c.client.from(table).select("id", { count: "exact", head: true }).eq("workspace_id", c.workspaceId).eq("organization_id", c.organizationId);
    query = table === "workspace_members" ? query.eq("status", "active") : query.is("deleted_at", null);
    const result = await query;
    return result.error ? null : result.count;
  }));
  return { status: data.status, endsAt: data.trial_ends_at, source: redemption ? "vayon3day" : data.trial_ends_at ? "legacy" : "none", redeemedAt: redemption?.redeemed_at ?? null, usage: { properties: counts[0], leads: counts[1], companies: counts[2], members: counts[3] === null ? null : Math.max(0, counts[3] - 1) } };
});
