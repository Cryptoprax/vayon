import "server-only";
import { SubscriptionWriteService } from "@/features/vayon/billing/services/subscription-write.service";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { workforceEmployeeCodes, type AIEmployeeCode } from "../domain/models";
import { OpenAIProvider } from "../providers/openai.provider";
import type { RuntimeChatInput, WorkforceRuntimeObservability } from "./models";
import { WorkforceConversationRepository } from "./repository";
import { SalesAIService } from "@/features/platform/sales-ai/services/sales-ai.service";
import { CRMAIService } from "@/features/platform/crm-ai/services/crm-ai.service";
import { WhatsAppAIService } from "@/features/platform/whatsapp-ai/services/whatsapp-ai.service";
import { MarketingAIService } from "@/features/platform/marketing-ai/services/marketing-ai.service";
import { ExecutiveAIService } from "@/features/platform/executive-ai/services/executive-ai.service";
import { OpenAIRuntimeConfigurationService, environmentOpenAIConfiguration, type OpenAIRuntimeConfiguration } from "../services/runtime-configuration";
import type { TrustedWorkforceContext } from "./trusted-context";
import { TrustedWorkforceRuntime } from "./trusted-runtime";
import { generateWorkforceReply } from "./generation";
import { buildWorkforceEvidence, type PropertyRetrievalPort } from "./property-context";
import { PropertyKnowledgeRetrievalService } from "@/features/vayon/property-knowledge/retrieval/retrieval.service";

const employees = workforceEmployeeCodes;
const allowedSources = new Set(["crm", "gmail", "calendar", "whatsapp", "deal", "task"]);

export class WorkforceRuntimeService {
  constructor(private repository: WorkforceConversationRepository, private provider = new OpenAIProvider(), private workspaceId: string, private configuration: OpenAIRuntimeConfiguration = environmentOpenAIConfiguration(), private propertyRetrieval: PropertyRetrievalPort | null = null) {}
  static async production() { const context = await operationsContext(), configuration = await new OpenAIRuntimeConfigurationService(context).resolve(); return new WorkforceRuntimeService(new WorkforceConversationRepository(context), new OpenAIProvider(undefined, configuration), context.workspaceId, configuration, new PropertyKnowledgeRetrievalService(context.client, context.organizationId, context.workspaceId)); }
  /**
   * Webhook-safe entry point -- never reads cookies, never accepts a raw
   * public payload. `context` must already be a validated TrustedWorkforceContext
   * (see buildTrustedWorkforceContext() in trusted-context.ts). Returns a
   * TrustedWorkforceRuntime, not a WorkforceRuntimeService: OpenAI invocation
   * (.chat()) is intentionally not exposed on the trusted path yet.
   */
  static forTrustedContext(context: TrustedWorkforceContext): TrustedWorkforceRuntime {
    if (!employees.includes(context.employeeCode)) throw new Error("Unsupported AI employee.");
    return TrustedWorkforceRuntime.create(context);
  }
  history(employee: AIEmployeeCode, query = "") { return this.repository.snapshot(employee, query); }
  health() { return this.provider.health(); }
  async observability(): Promise<WorkforceRuntimeObservability> {
    const [health, usage] = await Promise.all([this.health(), this.repository.usageSummary().catch(() => ({ estimatedCost: 0, lastResponse: null, latencyMs: null, model: null }))]);
    return { ...usage, provider: health.state === "unavailable" ? "deterministic" : "openai", model: health.model || usage.model, latencyMs: health.latencyMs ?? usage.latencyMs, health };
  }

  async *chat(input: RuntimeChatInput) {
    await new SubscriptionWriteService().require();
    if (!employees.includes(input.employee)) throw new Error("Unsupported AI employee.");
    if (!input.message.trim() || input.message.length > 20_000) throw new Error("A message between 1 and 20,000 characters is required.");
    const refs = (input.contextRefs ?? []).filter((ref) => allowedSources.has(ref.type) && /^[a-zA-Z0-9_-]{1,100}$/.test(ref.id));
    const conversationId = input.conversationId ?? await this.repository.create(input.employee, input.message.trim());
    await this.repository.append({ conversationId, role: "user", content: input.message.trim() });
    const salesEvidence = input.employee === "sales-ai" ? await (await SalesAIService.production()).runtimeContext() : null;
    const crmEvidence = input.employee === "crm-ai" ? await (await CRMAIService.production()).runtimeContext() : null;
    const whatsappEvidence = input.employee === "whatsapp-ai" ? await (await WhatsAppAIService.production()).runtimeContext() : null;
    const marketingEvidence = input.employee === "marketing-ai" ? await (await MarketingAIService.production()).runtimeContext() : null;
    const executiveEvidence = input.employee === "executive-ai" ? await (await ExecutiveAIService.production()).runtimeContext() : null;
    const property = await buildWorkforceEvidence({ employee: input.employee, message: input.message, propertyId: input.propertyId, leadId: input.leadId, retrieval: this.propertyRetrieval });
    const result = yield* generateWorkforceReply({
      employee: input.employee,
      message: input.message,
      refs,
      evidence: { sales: salesEvidence, crm: crmEvidence, whatsapp: whatsappEvidence, marketing: marketingEvidence, executive: executiveEvidence },
      provider: this.provider,
      workspaceId: this.workspaceId,
      model: this.configuration.model,
      maxOutputTokens: this.configuration.maxOutputTokens,
      conversationId,
      ...(property ? { propertyKnowledge: property.promptSection } : {}),
    });
    await this.repository.append({ conversationId, role: "assistant", content: result.output, ...(property?.sourceRefs.length ? { sourceRefs: property.sourceRefs } : {}), model: result.cost.model, usage: { ...result.usage, completionTokens: Math.ceil(result.output.length / 4), totalTokens: result.usage.promptTokens + Math.ceil(result.output.length / 4) }, cost: result.cost, latencyMs: result.latencyMs });
    yield { type: "complete" as const, conversationId, usage: result.usage, cost: result.cost, model: result.cost.model, latencyMs: result.latencyMs, recommendationOnly: true as const, ...(property ? { propertyContext: property.summary, ...(property.sourceRefs.length ? { sources: property.sourceRefs } : {}) } : {}) };
  }
}
