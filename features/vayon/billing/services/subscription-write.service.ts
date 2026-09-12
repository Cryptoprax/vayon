import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { isFounder } from "@/features/platform/founder/services/founder-context";
import { subscriptionMessage, type SubscriptionWriteDecision, type SubscriptionWriteResource } from "./subscription-write-contract";

export class SubscriptionWriteError extends Error {
  constructor(readonly decision: SubscriptionWriteDecision) { super(subscriptionMessage(decision)); this.name = "SubscriptionWriteError"; }
}

/** Commercial checks only. Existing authentication, RBAC and repository checks still run. */
export class SubscriptionWriteService {
  async check(resource: SubscriptionWriteResource = "write", email?: string): Promise<SubscriptionWriteDecision> {
    const c = await operationsContext();
    const { data: { user }, error: authError } = await c.client.auth.getUser();
    if (authError || !user) throw new Error("Authentication required.");
    if (isFounder(user)) return { allowed: true };
    const { data: subscription, error } = await c.client.from("subscriptions").select("status").eq("organization_id", c.organizationId).eq("workspace_id", c.workspaceId).is("deleted_at", null).maybeSingle();
    if (error || !subscription) return { allowed: false, code: "SUBSCRIPTION_UNVERIFIED", resource };
    // Preserve all existing paid-workspace behavior; existing paid-plan licensing remains authoritative.
    if (subscription.status !== "trialing") return { allowed: true };
    const result = await c.client.rpc("check_workspace_subscription_write", { p_workspace_id: c.workspaceId, p_resource: resource, p_email: email?.trim().toLowerCase() ?? null });
    if (result.error || !result.data || typeof result.data.allowed !== "boolean") return { allowed: false, code: "SUBSCRIPTION_UNVERIFIED", resource };
    return result.data as SubscriptionWriteDecision;
  }
  async require(resource: SubscriptionWriteResource = "write", email?: string) {
    const decision = await this.check(resource, email);
    if (!decision.allowed) throw new SubscriptionWriteError(decision);
  }
  /** Worker boundary: the target comes from the existing claimed job, never a browser-selected bypass. */
  async requireJobWorkspace(client: SupabaseClient, workspaceId: string) {
    const subscription = await client.from("subscriptions").select("status").eq("workspace_id", workspaceId).is("deleted_at", null).maybeSingle();
    if (!subscription.error && subscription.data && subscription.data.status !== "trialing") return;
    const { data, error } = await client.rpc("check_workspace_subscription_write", { p_workspace_id: workspaceId, p_resource: "write", p_email: null });
    if (error || !data || typeof data.allowed !== "boolean") throw new SubscriptionWriteError({ allowed: false, code: "SUBSCRIPTION_UNVERIFIED" });
    if (!data.allowed) throw new SubscriptionWriteError(data as SubscriptionWriteDecision);
  }
  async requireTargetWorkspace(workspaceId: string) {
    const c = await operationsContext();
    await this.requireJobWorkspace(c.client, workspaceId);
  }
}
