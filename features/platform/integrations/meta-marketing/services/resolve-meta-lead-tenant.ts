import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetaLeadTenantResolution } from "../domain/types";

/**
 * Part 26: the clean future API a Phase M3 leadgen webhook will call. NOT
 * wired to any webhook yet -- there is no leadgen route in this phase. Given
 * only a Meta pageId/formId (exactly what a leadgen webhook payload
 * contains), deterministically resolves the owning organization/workspace/
 * connection/property without trusting anything else the caller supplies,
 * mirroring the WhatsApp webhook's connectionByPhoneNumber() pattern: the
 * tenant is derived from a provider-issued identifier looked up in VAYON's
 * own table, never from a request-supplied org/workspace id.
 *
 * Channel-independent like K4's retrievePropertyKnowledge(): the Supabase
 * client is injected, so an interactive caller passes a session client (RLS
 * applies) and a future trusted webhook context would pass a service-role
 * client with these same explicit predicates.
 *
 * Returns null (not a guess) when zero or more than one active mapping
 * exists for the form, when the page/form pair does not match, or when the
 * mapping's own connection is not currently 'connected' -- fail closed,
 * exactly like K4's resolveLeadProperty() never picks among multiple
 * candidates.
 *
 * Phase M3 completion note: the connection-status check was added here
 * because the original M1/M2 version only checked mapping status, not the
 * owning connection's status. In practice disconnect_meta_marketing() already
 * deactivates every dependent mapping at disconnect time, so this was not
 * reachable through today's only state transition -- but M1/M2 also reserves
 * 'expired'/'error' connection statuses that no code sets yet, and a
 * form-mapping resolver should not depend on every future caller remembering
 * to deactivate mappings whenever a connection stops being healthy. This is a
 * narrow correctness fix to the resolver's own query, not a change to OAuth,
 * token storage, or the connection schema.
 */
export async function resolveMetaLeadTenant(client: SupabaseClient, pageId: string, formId: string): Promise<MetaLeadTenantResolution | null> {
  const { data, error } = await client
    .from("meta_lead_form_mappings")
    .select("organization_id,workspace_id,connection_id,property_id,campaign_id")
    .eq("page_id", pageId)
    .eq("form_id", formId)
    .eq("status", "active")
    .limit(2);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length !== 1) return null;

  const row = rows[0] as Record<string, unknown>;
  const connectionId = String(row.connection_id);

  const { data: connection, error: connectionError } = await client
    .from("meta_marketing_connections")
    .select("id")
    .eq("id", connectionId)
    .eq("status", "connected")
    .is("deleted_at", null)
    .maybeSingle();
  if (connectionError) throw connectionError;
  if (!connection) return null;

  return {
    organizationId: String(row.organization_id),
    workspaceId: String(row.workspace_id),
    connectionId,
    propertyId: String(row.property_id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
  };
}
