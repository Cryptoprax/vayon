import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { EnterpriseRateLimitService } from "@/features/platform/security-review/services/rate-limit.service";
import { OpenAIProvider } from "../providers/openai.provider";
import { OpenAIRuntimeConfigurationService } from "../services/runtime-configuration";
import { log } from "@/lib/observability/logger";
import { retrievePropertyKnowledge } from "@/features/vayon/property-knowledge/retrieval/retrieval.service";
import { generateWorkforceReply } from "./generation";
import { buildWorkforceEvidence, type PropertyKnowledgeContext } from "./property-context";
import type { WorkforceMessage } from "./models";
import { WorkforceConversationRepository } from "./repository";
import type { TrustedWorkforceContext } from "./trusted-context";

export type GenerateDraftOutcome =
  | { readonly outcome: "generated"; readonly conversationId: string; readonly messageId: string; readonly output: string; readonly propertyContext?: PropertyKnowledgeContext["summary"] }
  | { readonly outcome: "already_generated"; readonly conversationId: string; readonly messageId: string; readonly output: string }
  | { readonly outcome: "rate_limited"; readonly conversationId: string };

/**
 * Webhook-safe counterpart to the interactive WorkforceRuntimeService.
 *
 * Deliberately does NOT expose .chat(). Phase E2 built the persistence
 * primitives a trusted, non-interactive caller (a verified Meta webhook, not
 * a browser session) needs to participate in the SAME
 * ai_workforce_conversations/ai_workforce_messages history WorkforceRuntimeService
 * already uses. Phase E3 adds generateDraft(), which calls the SAME shared
 * generation core (generateWorkforceReply, also used by chat()) but stops
 * after persisting the assistant reply as an unsent DRAFT -- it never sends
 * a WhatsApp message, calls Meta, or mutates CRM beyond the lead linkage E1
 * already established. Conservative by design (Part 12): no per-employee
 * evidence service is invoked here, unlike chat(). Phase K6 adds exactly one
 * read-only evidence source: the SAME K5 assembler (buildWorkforceEvidence) over
 * the SAME K4 retrieval core, scoped to the E1-resolved lead. The property is
 * never taken from the inbound payload; nothing else is presented as fetched
 * CRM/property context.
 *
 * Every tenant field on `context` must already have been derived from a
 * trusted source before this is constructed -- see buildTrustedWorkforceContext()
 * in trusted-context.ts. This class never accepts a raw HTTP payload and never
 * reads cookies; it uses a service-role Supabase client exclusively.
 */
export class TrustedWorkforceRuntime {
  private constructor(private repository: WorkforceConversationRepository, private client: SupabaseClient, private context: TrustedWorkforceContext) {}

  static create(context: TrustedWorkforceContext): TrustedWorkforceRuntime {
    const client = createSupabaseServiceClient();
    const repository = new WorkforceConversationRepository({ client, organizationId: context.organizationId, workspaceId: context.workspaceId });
    return new TrustedWorkforceRuntime(repository, client, context);
  }

  /** Deterministic find-or-create: the same (org, workspace, employee, thread) always resolves to the same conversation. */
  async resolveConversation(): Promise<string> {
    return this.repository.resolveTrustedConversation({
      employeeCode: this.context.employeeCode,
      communicationThreadId: this.context.communicationThreadId,
      leadId: this.context.leadId,
    });
  }

  async appendMessage(role: "user" | "assistant", content: string): Promise<{ conversationId: string; messageId: string }> {
    const conversationId = await this.resolveConversation();
    const messageId = await this.repository.appendTrusted({ conversationId, role, content });
    return { conversationId, messageId };
  }

  async history(conversationId: string, limit?: number): Promise<readonly WorkforceMessage[]> {
    return this.repository.trustedHistory(conversationId, limit);
  }

  /**
   * Generate an unsent AI draft reply for one inbound WhatsApp text message.
   * Idempotent per (conversation, sourceMessageId): a retried call for the
   * same provider message id neither appends a duplicate user-message copy
   * nor invokes the provider a second time -- see PART 8 in the Phase E3
   * report. Rate-limited via the existing "ai-runtime" boundary
   * (EnterpriseRateLimitService), keyed by workspace+thread rather than a
   * request IP, since the caller here is Meta infrastructure, not the lead.
   */
  async generateDraft(input: { message: string; sourceMessageId: string }): Promise<GenerateDraftOutcome> {
    if (!input.message.trim() || input.message.length > 20_000) throw new Error("A message between 1 and 20,000 characters is required.");

    const conversationId = await this.resolveConversation();
    await this.repository.appendTrusted({ conversationId, role: "user", content: input.message.trim(), sourceMessageId: input.sourceMessageId });

    const existingDraft = await this.repository.findTrustedAssistantDraft(conversationId, input.sourceMessageId);
    if (existingDraft) return { outcome: "already_generated", conversationId, messageId: existingDraft.id, output: existingDraft.content };

    const rateLimitSubject = `${this.context.workspaceId}:${this.context.communicationThreadId}`;
    const limit = await new EnterpriseRateLimitService().enforce("ai-runtime", rateLimitSubject);
    if (!limit.allowed) return { outcome: "rate_limited", conversationId };

    const configuration = await new OpenAIRuntimeConfigurationService({ client: this.client, workspaceId: this.context.workspaceId }).resolve();
    const provider = new OpenAIProvider(undefined, configuration);
    // K6: property knowledge is resolved from the trusted, server-derived tenant + E1 lead only
    // (propertyId is deliberately null -- a webhook payload can never select a property). It runs
    // after the idempotency and rate-limit checks, so a replay never pays for retrieval, and it
    // never throws: a failure becomes an explicit "unavailable" section for the draft.
    const property = await buildWorkforceEvidence({
      employee: this.context.employeeCode,
      message: input.message,
      propertyId: null,
      leadId: this.context.leadId,
      retrieval: { retrieve: (request) => retrievePropertyKnowledge(this.client, { ...request, organizationId: this.context.organizationId, workspaceId: this.context.workspaceId }) },
    });
    const generator = generateWorkforceReply({
      employee: this.context.employeeCode,
      message: input.message,
      refs: [],
      evidence: {},
      ...(property ? { propertyKnowledge: property.promptSection } : {}),
      provider,
      workspaceId: this.context.workspaceId,
      model: configuration.model,
      maxOutputTokens: configuration.maxOutputTokens,
      conversationId,
    });
    let step = await generator.next();
    while (!step.done) step = await generator.next();
    const result = step.value;

    const messageId = await this.repository.appendTrusted({ conversationId, role: "assistant", content: result.output, sourceMessageId: input.sourceMessageId, deliveryState: "draft" });
    if (property?.sourceRefs.length) {
      await this.repository.attachTrustedSourceRefs(messageId, property.sourceRefs).catch((error) => log("whatsapp_ai.draft_source_refs_failed", { conversationId, messageId, reason: error instanceof Error ? error.name : "unknown" }));
    }
    return { outcome: "generated", conversationId, messageId, output: result.output, ...(property ? { propertyContext: property.summary } : {}) };
  }
}
