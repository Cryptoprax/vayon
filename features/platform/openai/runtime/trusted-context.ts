import "server-only";
import { workforceEmployeeCodes, type AIEmployeeCode } from "../domain/models";

/**
 * Only "whatsapp" is buildable today. "web" is not included here because the
 * interactive path never goes through this trusted factory -- it keeps using
 * operationsContext()/WorkforceRuntimeService.production() exactly as before.
 * Adding a future channel (email, voice, instagram, facebook_messenger) means
 * adding a literal here and to the runtime union below, never a migration --
 * see the migration header comment on why `channel` itself is unconstrained text.
 */
export type TrustedWorkforceChannel = "whatsapp";

export interface TrustedWorkforceContext {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly employeeCode: AIEmployeeCode;
  readonly channel: TrustedWorkforceChannel;
  readonly communicationThreadId: string;
  readonly leadId: string | null;
}

export interface TrustedWorkforceContextInput {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly employeeCode: string;
  readonly channel: string;
  readonly communicationThreadId: string;
  readonly leadId: string | null;
}

/**
 * The only supported way to construct a TrustedWorkforceContext. This never
 * reads a request body, header, or any other client-controlled input itself
 * -- the caller must already have derived organizationId/workspaceId from a
 * trusted source (the WhatsApp connection row resolved by
 * WhatsAppRepository.connectionByPhoneNumber(), never from the inbound
 * sender payload) and leadId/communicationThreadId from the Phase E1
 * identity resolver. This function only validates shape; it does not and
 * cannot upgrade an untrusted value into a trusted one.
 */
export function buildTrustedWorkforceContext(input: TrustedWorkforceContextInput): TrustedWorkforceContext {
  if (!input.organizationId || !input.workspaceId) throw new Error("Trusted context requires a server-derived organization and workspace.");
  if (!workforceEmployeeCodes.includes(input.employeeCode as AIEmployeeCode)) throw new Error("Unsupported AI employee.");
  if (input.channel !== "whatsapp") throw new Error("Unsupported trusted channel.");
  if (!input.communicationThreadId) throw new Error("A communication thread is required for a trusted conversation.");
  return {
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    employeeCode: input.employeeCode as AIEmployeeCode,
    channel: "whatsapp",
    communicationThreadId: input.communicationThreadId,
    leadId: input.leadId,
  };
}
