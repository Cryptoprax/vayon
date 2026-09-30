import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { SubscriptionEntitlementService } from "@/features/vayon/billing/services/entitlement.service";

/**
 * Phase M6: the single reusable server-side policy service answering "can
 * VAYON contact this lead on WhatsApp right now?" NO SEND happens here or
 * anywhere in its call graph -- this is a read-only decision, never an
 * action.
 *
 * Two deliberately separate layers (Part 20):
 *  A. CONSENT ELIGIBILITY -- "are we allowed to contact this person?"
 *  B. TRANSPORT ELIGIBILITY -- "can VAYON send right now?"
 * Consent can be valid while transport is blocked (e.g. granted consent but
 * no approved template yet) -- the two are never conflated into one flag.
 */
export type ConsentBlockReason =
  | "lead_not_found" | "do_not_contact" | "no_phone" | "phone_not_normalized"
  | "no_consent" | "consent_revoked" | "consent_unverifiable";
export type TransportBlockReason = "whatsapp_not_entitled" | "connection_unavailable" | "template_required_unavailable";
export type TemplateAvailability = "not_required" | "available" | "unavailable" | "unknown";

export interface EntitlementPort {
  feature(feature: "whatsapp"): Promise<{ readonly allowed: boolean }>;
}
/** Injected, never a direct Meta Graph call from this service -- production wiring (if any) is a future integration step, not built in M6. */
export interface WhatsAppTemplateAvailabilityPort {
  hasApprovedTemplate(scope: { organizationId: string; workspaceId: string }): Promise<boolean>;
}

export interface WhatsAppOutreachEligibility {
  readonly leadId: string;
  readonly eligible: boolean;
  readonly normalizedPhone: string | null;
  readonly consent: {
    readonly status: "valid" | "blocked";
    readonly reason: ConsentBlockReason | "consent_granted";
    readonly consentId: string | null;
  };
  readonly transport: {
    readonly status: "ready" | "blocked" | "not_applicable";
    readonly reason: TransportBlockReason | null;
    readonly requiresTemplate: boolean;
    readonly templateAvailability: TemplateAvailability;
    /** Phase M7: the active connection's id, only populated once transport reaches the connection check -- lets a send flow claim an execution without a second connection lookup. */
    readonly connectionId: string | null;
  };
}

function consentBlocked(leadId: string, reason: ConsentBlockReason, normalizedPhone: string | null, consentId: string | null = null): WhatsAppOutreachEligibility {
  return {
    leadId, eligible: false, normalizedPhone,
    consent: { status: "blocked", reason, consentId },
    transport: { status: "not_applicable", reason: null, requiresTemplate: false, templateAvailability: "unknown", connectionId: null },
  };
}

/**
 * Part 17: does VAYON already know the lead messaged the business within
 * the WhatsApp customer-service window? A brand-new Meta lead with no prior
 * WhatsApp conversation never has an open window -- this never assumes one
 * merely because a Meta form was submitted (submitting a lead form is not a
 * WhatsApp message).
 */
async function hasRecentInboundWithin24Hours(client: SupabaseClient, scope: { organizationId: string; workspaceId: string }, leadId: string): Promise<boolean> {
  const threads = await client
    .from("communication_threads")
    .select("id")
    .eq("organization_id", scope.organizationId)
    .eq("workspace_id", scope.workspaceId)
    .eq("related_type", "lead")
    .eq("related_id", leadId);
  if (threads.error) throw threads.error;
  const threadIds = ((threads.data ?? []) as Record<string, unknown>[]).map((row) => String(row.id));
  if (threadIds.length === 0) return false;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await client
    .from("communications")
    .select("id")
    .in("thread_id", threadIds)
    .eq("channel", "whatsapp")
    .eq("direction", "inbound")
    .gte("occurred_at", cutoff)
    .limit(1);
  if (recent.error) throw recent.error;
  return ((recent.data ?? []) as unknown[]).length > 0;
}

/**
 * Core, testable evaluator (mirrors K4's resolveLeadProperty(client, scope,
 * leadId) injection shape). Order: lead existence -> do_not_contact
 * (Part 15/the coarse global override) -> phone presence -> safe
 * normalization (Part 16, never guesses a country) -> consent (Part 13) ->
 * entitlement (Part 14, reuses the existing catalog verbatim) -> connection
 * (Part 15) -> 24h window / template requirement (Part 17/18/19).
 */
export async function resolveWhatsAppOutreachEligibility(
  client: SupabaseClient,
  scope: { organizationId: string; workspaceId: string },
  leadId: string,
  options: { entitlement: EntitlementPort; templatePort?: WhatsAppTemplateAvailabilityPort },
): Promise<WhatsAppOutreachEligibility> {
  const lead = await client
    .from("leads")
    .select("id,phone,normalized_phone,do_not_contact")
    .eq("id", leadId)
    .eq("organization_id", scope.organizationId)
    .eq("workspace_id", scope.workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (lead.error) throw lead.error;
  if (!lead.data) return consentBlocked(leadId, "lead_not_found", null);
  const leadRow = lead.data as Record<string, unknown>;

  if (leadRow.do_not_contact) return consentBlocked(leadId, "do_not_contact", null);
  if (!leadRow.phone) return consentBlocked(leadId, "no_phone", null);

  const normalizedPhone = leadRow.normalized_phone ? String(leadRow.normalized_phone) : null;
  if (!normalizedPhone) return consentBlocked(leadId, "phone_not_normalized", null);

  const consentRow = await client
    .from("communication_consents")
    .select("id,status")
    .eq("organization_id", scope.organizationId)
    .eq("workspace_id", scope.workspaceId)
    .eq("lead_id", leadId)
    .eq("channel", "whatsapp")
    .eq("purpose", "marketing")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (consentRow.error) throw consentRow.error;
  const consent = consentRow.data as Record<string, unknown> | null;

  if (!consent) return consentBlocked(leadId, "no_consent", normalizedPhone);
  const consentId = String(consent.id);
  if (consent.status === "revoked") return consentBlocked(leadId, "consent_revoked", normalizedPhone, consentId);
  if (consent.status === "unknown") return consentBlocked(leadId, "consent_unverifiable", normalizedPhone, consentId);
  if (consent.status === "not_granted") return consentBlocked(leadId, "no_consent", normalizedPhone, consentId);

  // status === "granted" -- consent is valid. Evaluate transport readiness.
  const entitlement = await options.entitlement.feature("whatsapp");
  if (!entitlement.allowed) {
    return {
      leadId, eligible: false, normalizedPhone,
      consent: { status: "valid", reason: "consent_granted", consentId },
      transport: { status: "blocked", reason: "whatsapp_not_entitled", requiresTemplate: false, templateAvailability: "unknown", connectionId: null },
    };
  }

  const connection = await client
    .from("whatsapp_connections")
    .select("id,status")
    .eq("organization_id", scope.organizationId)
    .eq("workspace_id", scope.workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (connection.error) throw connection.error;
  const connectionRow = connection.data as Record<string, unknown> | null;
  if (!connectionRow || connectionRow.status !== "connected") {
    return {
      leadId, eligible: false, normalizedPhone,
      consent: { status: "valid", reason: "consent_granted", consentId },
      transport: { status: "blocked", reason: "connection_unavailable", requiresTemplate: false, templateAvailability: "unknown", connectionId: null },
    };
  }
  const connectionId = String(connectionRow.id);

  const requiresTemplate = !(await hasRecentInboundWithin24Hours(client, scope, leadId));

  let templateAvailability: TemplateAvailability = "not_required";
  if (requiresTemplate) {
    templateAvailability = options.templatePort ? ((await options.templatePort.hasApprovedTemplate(scope)) ? "available" : "unavailable") : "unknown";
  }

  // Fail closed: "unknown" template availability is never treated as ready.
  const transportReady = !requiresTemplate || templateAvailability === "available";
  return {
    leadId, eligible: transportReady, normalizedPhone,
    consent: { status: "valid", reason: "consent_granted", consentId },
    transport: {
      status: transportReady ? "ready" : "blocked",
      reason: transportReady ? null : "template_required_unavailable",
      requiresTemplate, templateAvailability, connectionId,
    },
  };
}

/** Production convenience wrapper for the current authenticated session's own workspace -- the core function above stays fully injectable for tests. */
export async function whatsAppOutreachEligibilityForCurrentUser(leadId: string): Promise<WhatsAppOutreachEligibility> {
  const context = await operationsContext();
  return resolveWhatsAppOutreachEligibility(
    context.client,
    { organizationId: context.organizationId, workspaceId: context.workspaceId },
    leadId,
    { entitlement: new SubscriptionEntitlementService() },
  );
}
