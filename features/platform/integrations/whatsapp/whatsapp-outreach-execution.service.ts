import "server-only";
import { randomUUID } from "node:crypto";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { SubscriptionEntitlementService } from "@/features/vayon/billing/services/entitlement.service";
import { WhatsAppPlatformService } from "@/features/platform/whatsapp/services/whatsapp-platform.service";
import type { WhatsAppTemplate } from "@/features/platform/whatsapp/domain/models";
import { resolveLeadProperty } from "@/features/vayon/property-knowledge/retrieval/retrieval.service";
import { resolveWhatsAppOutreachEligibility, type WhatsAppOutreachEligibility, type WhatsAppTemplateAvailabilityPort } from "./whatsapp-outreach-eligibility.service";
import {
  filterUsableTemplates, findUsableTemplate, renderTemplatePreview, validateAndBuildTemplateComponents,
  TemplateVariableError, type BuiltTemplateComponent, type TemplateVariablesByComponent,
} from "./whatsapp-outreach-template";

/**
 * Phase M7: the single server-only entry point that can trigger a real
 * first-contact WhatsApp send for a Meta lead. Human-initiated only -- never
 * called from a cron processor, a webhook, or automatically after M5/M6.
 * organizationId/workspaceId are derived internally via operationsContext(),
 * exactly like Phase E5's executeApprovedWhatsAppDraft -- no parameter for a
 * browser to override. The client supplies only: leadId, a server-generated
 * executionId (opaque, from prepareWhatsAppOutreach), the chosen approved
 * template's name/language, and the human-entered variable values -- never
 * phone, organizationId, workspaceId, a connection token, phone_number_id,
 * consent state, or eligible=true.
 */

function templatePortFrom(platform: WhatsAppPlatformService, cache: { templates: readonly WhatsAppTemplate[] | null }): WhatsAppTemplateAvailabilityPort {
  return {
    async hasApprovedTemplate() {
      cache.templates = cache.templates ?? (await platform.templates());
      return filterUsableTemplates(cache.templates).length > 0;
    },
  };
}

export interface WhatsAppOutreachPreparation {
  readonly executionId: string;
  readonly eligibility: WhatsAppOutreachEligibility;
  readonly usableTemplates: readonly WhatsAppTemplate[];
  readonly property: { readonly status: string; readonly propertyId: string | null };
}

/**
 * Part 2/28: a bounded, single Graph template-list call made only when a
 * human opens the outreach flow for this one lead -- never from a cron
 * processor, never repeated needlessly (the same fetched list is reused for
 * both the eligibility template-availability check and the templates
 * offered to the human, so this fetches Meta's template list AT MOST once
 * per call, and not at all when the lead is not consent-eligible or already
 * has an open freeform window).
 */
export async function prepareWhatsAppOutreach(leadId: string): Promise<WhatsAppOutreachPreparation> {
  const context = await operationsContext();
  const platform = new WhatsAppPlatformService();
  const cache: { templates: readonly WhatsAppTemplate[] | null } = { templates: null };

  const eligibility = await resolveWhatsAppOutreachEligibility(
    context.client,
    { organizationId: context.organizationId, workspaceId: context.workspaceId },
    leadId,
    { entitlement: new SubscriptionEntitlementService(), templatePort: templatePortFrom(platform, cache) },
  );

  const usableTemplates = cache.templates ? filterUsableTemplates(cache.templates) : [];

  // Part 8: K4's resolveLeadProperty, unchanged -- zero/one/many interests,
  // never guessed among multiple. The UI must require an explicit human
  // property selection when a template needs one and resolution is
  // ambiguous; this function only reports the resolution, it never guesses.
  const property = await resolveLeadProperty(context.client, { organizationId: context.organizationId, workspaceId: context.workspaceId }, leadId);

  return {
    executionId: randomUUID(),
    eligibility,
    usableTemplates,
    property: { status: property.status, propertyId: property.propertyId },
  };
}

export type ExecuteGovernedMetaLeadWhatsAppOutreachResult =
  | { readonly outcome: "sent"; readonly executionId: string; readonly providerMessageId: string }
  | { readonly outcome: "not_eligible"; readonly reason: string }
  | { readonly outcome: "already_claimed_or_sent" }
  | { readonly outcome: "invalid_template" }
  | { readonly outcome: "invalid_variables"; readonly code: string }
  | { readonly outcome: "send_failed"; readonly executionId: string; readonly failureCode: string };

function classifyOutreachFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/not connected/i.test(message)) return "connection_unavailable";
  if (/rate limit/i.test(message)) return "rate_limited";
  if (/must be renewed/i.test(message)) return "authentication_failed";
  if (/timeout|aborted/i.test(message)) return "timeout";
  if (/network|fetch failed/i.test(message)) return "network_error";
  return "unknown_error";
}

export async function executeGovernedMetaLeadWhatsAppOutreach(input: {
  readonly leadId: string;
  readonly executionId: string;
  readonly templateName: string;
  readonly templateLanguage: string;
  readonly variablesByComponent: TemplateVariablesByComponent;
}): Promise<ExecuteGovernedMetaLeadWhatsAppOutreachResult> {
  const context = await operationsContext();
  const platform = new WhatsAppPlatformService();
  const templates = await platform.templates();

  // PART 12: mandatory recheck immediately before send -- never trust a
  // previously rendered preview screen's eligibility. This is a fast,
  // user-friendly fail-closed check; claim_whatsapp_outreach_execution below
  // re-verifies the same conditions itself, inside one transaction, so this
  // check and the claim cannot race each other into an inconsistent decision.
  const eligibility = await resolveWhatsAppOutreachEligibility(
    context.client,
    { organizationId: context.organizationId, workspaceId: context.workspaceId },
    input.leadId,
    { entitlement: new SubscriptionEntitlementService(), templatePort: { hasApprovedTemplate: async () => filterUsableTemplates(templates).length > 0 } },
  );
  if (!eligibility.eligible || !eligibility.consent.consentId || !eligibility.transport.connectionId) {
    return { outcome: "not_eligible", reason: eligibility.transport.reason ?? eligibility.consent.reason };
  }

  const template = findUsableTemplate(templates, input.templateName, input.templateLanguage);
  if (!template) return { outcome: "invalid_template" };

  let components: readonly BuiltTemplateComponent[];
  try {
    components = validateAndBuildTemplateComponents(template, input.variablesByComponent);
  } catch (error) {
    if (error instanceof TemplateVariableError) return { outcome: "invalid_variables", code: error.code };
    throw error;
  }
  const renderedText = renderTemplatePreview(template, input.variablesByComponent);

  let executionId: string;
  try {
    const { data, error } = await context.client.rpc("claim_whatsapp_outreach_execution", {
      p_workspace_id: context.workspaceId,
      p_execution_id: input.executionId,
      p_lead_id: input.leadId,
      p_consent_id: eligibility.consent.consentId,
      p_connection_id: eligibility.transport.connectionId,
      p_template_name: template.name,
      p_template_language: template.language,
    });
    if (error) throw error;
    executionId = String(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ALREADY_CLAIMED_OR_SENT") || message.includes("NOT_ELIGIBLE") || message.includes("OUTREACH_IN_PROGRESS")) return { outcome: "already_claimed_or_sent" };
    throw error;
  }

  // PART 15: the exact current server-side normalized phone -- never the
  // browser, never a value cached from the prepare step.
  const { data: leadRow, error: leadError } = await context.client
    .from("leads")
    .select("normalized_phone")
    .eq("id", input.leadId)
    .eq("organization_id", context.organizationId)
    .eq("workspace_id", context.workspaceId)
    .single();
  if (leadError) throw leadError;
  const recipient = leadRow.normalized_phone ? String(leadRow.normalized_phone) : "";
  if (!recipient) {
    await context.client.rpc("mark_whatsapp_outreach_failed", { p_workspace_id: context.workspaceId, p_execution_id: executionId, p_failure_code: "phone_unavailable" });
    return { outcome: "send_failed", executionId, failureCode: "phone_unavailable" };
  }

  let providerResponse: { id?: string };
  try {
    providerResponse = await platform.sendTemplate({ to: recipient, name: template.name, language: template.language, components, approvalId: executionId, executionRequestId: executionId });
  } catch (error) {
    const failureCode = classifyOutreachFailure(error);
    await context.client.rpc("mark_whatsapp_outreach_failed", { p_workspace_id: context.workspaceId, p_execution_id: executionId, p_failure_code: failureCode });
    return { outcome: "send_failed", executionId, failureCode };
  }

  const providerMessageId = providerResponse.id ? String(providerResponse.id) : "";
  if (!providerMessageId) {
    await context.client.rpc("mark_whatsapp_outreach_failed", { p_workspace_id: context.workspaceId, p_execution_id: executionId, p_failure_code: "missing_provider_message_id" });
    return { outcome: "send_failed", executionId, failureCode: "missing_provider_message_id" };
  }

  const { error: succeededError } = await context.client.rpc("mark_whatsapp_outreach_sent", {
    p_workspace_id: context.workspaceId,
    p_execution_id: executionId,
    p_provider_message_id: providerMessageId,
    p_recipient: recipient,
    p_rendered_text: renderedText,
  });
  if (succeededError) throw succeededError;

  return { outcome: "sent", executionId, providerMessageId };
}
