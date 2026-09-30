import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeWhatsAppSenderId } from "@/features/vayon/lead/utils/phone";

/** The supplied phone could not be normalized -- fails closed, never guesses a country. */
export class InvalidPhoneError extends Error {
  constructor(message = "Phone number could not be normalized.") {
    super(message);
    this.name = "InvalidPhoneError";
  }
}
/** The workspace/organization pairing could not be resolved -- never proceeds with a guessed tenant. */
export class TenantResolutionError extends Error {
  constructor(message = "Workspace could not be resolved to an organization.") {
    super(message);
    this.name = "TenantResolutionError";
  }
}
/** The plan/subscription/catalog state required to complete the operation is missing or invalid. */
export class CrmConfigurationError extends Error {
  constructor(readonly cause: unknown) {
    super("CRM identity could not be resolved due to a configuration error.");
    this.name = "CrmConfigurationError";
  }
}
/** The database write itself failed for a reason other than the above. */
export class CrmWriteError extends Error {
  constructor(readonly cause: unknown) {
    super("CRM identity could not be written.");
    this.name = "CrmWriteError";
  }
}

export interface ResolveWhatsAppIdentityInput {
  readonly workspaceId: string;
  readonly phone: string;
  readonly displayName?: string;
}
export interface ResolveWhatsAppIdentityResult {
  readonly normalizedPhone: string;
  readonly leadId: string;
}

/**
 * Reusable, tenant-safe find-or-create for the CRM lead identity behind a
 * WhatsApp sender. organizationId is deliberately NOT a parameter -- it is
 * derived server-side, inside resolve_whatsapp_lead_identity(), from
 * workspaceId alone, so no caller (however this function is reached) can
 * override which organization a lead is created in.
 *
 * This is NOT the code path the live webhook uses for its actual, atomic
 * decision -- WhatsAppRepository.persist() calls process_whatsapp_message(),
 * which resolves identity inline inside the same transaction as the
 * message insert (see supabase/migrations/20261104000000_whatsapp_crm_identity
 * .sql for why: a separate round-trip from here could not share the same
 * advisory-lock transaction and would reopen the concurrent-duplicate race
 * this feature exists to prevent). This wrapper exists for direct
 * reuse/testability outside that hot path (e.g. future non-webhook
 * producers, admin tooling) without duplicating the RPC-calling logic.
 */
export async function resolveWhatsAppIdentity(input: ResolveWhatsAppIdentityInput): Promise<ResolveWhatsAppIdentityResult> {
  const normalizedPhone = normalizeWhatsAppSenderId(input.phone);
  if (!normalizedPhone) throw new InvalidPhoneError();

  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("resolve_whatsapp_lead_identity", {
    p_workspace_id: input.workspaceId,
    p_phone: normalizedPhone,
    p_display_name: input.displayName ?? null,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("TENANT_RESOLUTION_ERROR")) throw new TenantResolutionError(message);
    if (message.includes("INVALID_PHONE")) throw new InvalidPhoneError(message);
    if (message.includes("insufficient") || message.includes("service role required")) throw new CrmConfigurationError(error);
    throw new CrmWriteError(error);
  }

  return { normalizedPhone, leadId: String(data) };
}
