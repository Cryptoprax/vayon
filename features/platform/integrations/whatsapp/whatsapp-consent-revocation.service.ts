import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "@/lib/observability/logger";

export interface RecordWhatsAppOptOutInput {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly leadId: string;
  readonly sourceMessageId: string;
}

/**
 * Part 1/12: called ONLY from the trusted inbound webhook path (whatsapp.
 * service.ts's receive()), after process_whatsapp_message has already
 * resolved a lead and persisted the inbound message -- never reachable from
 * any client-facing surface. organizationId/workspaceId/leadId are all
 * already-trusted values derived from the connection row and the identity
 * resolver, never the raw provider payload.
 *
 * Idempotent: record_whatsapp_consent_revocation reports whether it created
 * a new row or found an existing one for this exact WhatsApp message id
 * (webhook retry) -- the activity_events write only happens on genuine
 * creation, so a retry never produces a duplicate event (Part 6/17).
 */
export async function recordWhatsAppConsentRevocation(client: SupabaseClient, input: RecordWhatsAppOptOutInput): Promise<string | null> {
  const { data, error } = await client.rpc("record_whatsapp_consent_revocation", {
    p_organization_id: input.organizationId,
    p_workspace_id: input.workspaceId,
    p_lead_id: input.leadId,
    p_source_message_id: input.sourceMessageId,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const consentId = row?.consent_id ? String(row.consent_id) : null;
  const created = Boolean(row?.created);

  if (consentId && created) {
    await Promise.resolve(client.from("activity_events").insert({
      organization_id: input.organizationId, workspace_id: input.workspaceId,
      event_type: "communication.consent.revoked", title: "WhatsApp marketing consent revoked",
      related_type: "lead", related_id: input.leadId,
      metadata: { leadId: input.leadId, consentId, sourceMessageId: input.sourceMessageId },
    })).catch(() => undefined);
  }

  log("whatsapp.consent_revoked", { leadId: input.leadId, consentId, created });
  return consentId;
}
