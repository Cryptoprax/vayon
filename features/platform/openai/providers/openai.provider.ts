import "server-only";
import OpenAI from"openai";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { log } from "@/lib/observability/logger";
import type { OpenAIProviderContract } from "../contracts/openai-provider";
import type {
  AIRecommendationOutput,
  ClassifiedOutput,
  ExtractedOutput,
  OpenAIHealthDiagnostic,
  OpenAIRequest,
  OpenAIResult,
  TokenUsage,
} from "../domain/models";
import { OpenAIModelRegistry } from "../services/model-registry";
import { environmentOpenAIConfiguration, type OpenAIRuntimeConfiguration } from "../services/runtime-configuration";

type Client = Pick<OpenAI, "responses" | "embeddings" | "moderations">;
const pool = new Map<string, Client>();

function client(apiKey: string): Client {
  const key = "workspace-environment";
  let value = pool.get(key);
  if (!value) {
    value = new OpenAI({
      apiKey,
      maxRetries: 2,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS ?? 30_000),
    });
    pool.set(key, value);
  }
  return value;
}

function configured() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_MISSING_API_KEY");
  return apiKey;
}

function abortSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(Number(process.env.OPENAI_TIMEOUT_MS ?? 30_000));
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

const recommendationSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  action: z.literal("review"),
  recommendationOnly: z.literal(true),
  executionAllowed: z.literal(false),
  approvalRequired: z.literal(true),
});
const classificationSchema = z.object({
  label: z.string(),
  confidence: z.number().min(0).max(1),
});
const extractionSchema = z.object({
  values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});

const diagnostics: Record<OpenAIHealthDiagnostic, string> = {
  connected: "Connected",
  missing_api_key: "Missing API key",
  invalid_api_key: "Invalid API key",
  authentication_failed: "Authentication failed",
  billing_required: "Billing required",
  insufficient_quota: "Insufficient quota",
  rate_limited: "Rate limited",
  model_unavailable: "Model unavailable",
  network_error: "Network error",
  timeout: "Timeout",
  provider_unavailable: "Provider unavailable",
  provider_exception: "Unknown provider error",
};

export function classifyOpenAIHealthError(reason: unknown): OpenAIHealthDiagnostic {
  if (reason instanceof Error && reason.message === "OPENAI_MISSING_API_KEY") return "missing_api_key";
  const error = reason as { status?: number; code?: string; type?: string; name?: string; message?: string };
  const code = String(error?.code ?? "").toLowerCase();
  const type = String(error?.type ?? "").toLowerCase();
  const name = String(error?.name ?? "").toLowerCase();
  const message = String(error?.message ?? "").toLowerCase();
  if (code === "invalid_api_key" || message.includes("incorrect api key")) return "invalid_api_key";
  if (error?.status === 401 || type.includes("authentication")) return "authentication_failed";
  if (code.includes("billing") || message.includes("billing")) return "billing_required";
  if (code === "insufficient_quota" || code === "credit_balance_exhausted" || type === "insufficient_quota" || message.includes("quota")) return "insufficient_quota";
  if (error?.status === 429) return "rate_limited";
  if (error?.status === 404 || code.includes("model_not_found") || message.includes("model") && message.includes("access")) return "model_unavailable";
  if (name.includes("abort") || name.includes("timeout") || code.includes("timeout")) return "timeout";
  if (name.includes("connection") || code.includes("connection") || code.includes("network") || message.includes("fetch failed")) return "network_error";
  if (typeof error?.status === "number" && error.status >= 500) return "provider_unavailable";
  return "provider_exception";
}

export class OpenAIProvider implements OpenAIProviderContract {
  readonly id = "openai" as const;
  readonly name = "OpenAI" as const;
  readonly version = "1.1.0";
  private models = new OpenAIModelRegistry();

  constructor(private api?: Client, private configuration: OpenAIRuntimeConfiguration = environmentOpenAIConfiguration()) {}
  async connect(): Promise<never> { redirect("/vayon/settings/ai/openai"); }
  async disconnect(): Promise<never> { throw new Error("OpenAI credentials are environment-managed and cannot be disconnected in the application."); }

  async health() {
    const model = this.models.resolve(this.configuration.model);
    const started = performance.now();
    try {
      const api = this.api ?? client(configured());
      await api.responses.create({
        model: String(model.id),
        instructions: "You are a health check.",
        input: "OK",
        // GPT-5 currently enforces 16 as the minimum output-token limit.
        max_output_tokens: 16,
        store: false,
        reasoning: { effort: "minimal" },
      }, { signal: abortSignal() });
      return {
        state: "healthy" as const,
        connected: true,
        model: String(model.id),
        latencyMs: Math.round(performance.now() - started),
        quota: "available" as const,
        version: this.version,
        diagnostic: "connected" as const,
        reason: diagnostics.connected,
      };
    } catch (reason) {
      const diagnostic = classifyOpenAIHealthError(reason);
      const latencyMs = Math.round(performance.now() - started);
      const metadata = reason as { status?: number; code?: string; type?: string; name?: string };
      log("openai.health.failed", { diagnostic, model: String(model.id), latencyMs, status: metadata?.status ?? null, code: metadata?.code ?? null, type: metadata?.type ?? null, errorName: metadata?.name ?? null });
      return {
        state: "unavailable" as const,
        connected: false,
        model: String(model.id),
        latencyMs,
        quota: diagnostic === "insufficient_quota" ? "limited" as const : "unknown" as const,
        version: this.version,
        diagnostic,
        reason: diagnostics[diagnostic],
      };
    }
  }

  async validate() { return (await this.health()).state === "healthy"; }
  capabilities() { return this.models.capabilities(); }
  chat(input: OpenAIRequest) { return this.responses(input); }

  async responses(input: OpenAIRequest): Promise<OpenAIResult> {
    this.validatePrompt(input);
    await this.ensureSafe(`${input.system}\n${input.prompt}`, input.signal);
    const model = this.models.resolve(input.model ?? this.configuration.model);
    const api = this.api ?? client(configured());
    const started = performance.now();
    const response = await this.withModelFallback(model.id, async (modelId) => api.responses.create({
      model: String(modelId), instructions: input.system, input: input.prompt,
      max_output_tokens: Math.min(input.maxOutputTokens ?? this.configuration.maxOutputTokens, model.maximumOutputTokens), store: false,
      reasoning: { effort: this.configuration.reasoningLevel },
    }, { signal: abortSignal(input.signal) }));
    const usage = this.usage(response.usage?.input_tokens, response.usage?.output_tokens);
    const usedModel = String(response.model ?? model.id);
    return { output: response.output_text, provider: "openai", model: usedModel, latencyMs: Math.round(performance.now() - started), usage, cost: this.models.estimate(usedModel, usage.promptTokens, usage.completionTokens), recommendationOnly: true, executionAllowed: false };
  }

  embeddings(input: readonly string[], workspaceId: string, signal?: AbortSignal) {
    if (!workspaceId) throw new Error("Workspace attribution is required.");
    if (!input.length || input.some((x) => !x.trim())) throw new Error("Embedding input is required.");
    return this.embeddingRequest(input, signal);
  }
  private async embeddingRequest(input: readonly string[], signal?: AbortSignal) {
    await this.ensureSafe(input.join("\n"), signal);
    const api = this.api ?? client(configured());
    const response = await api.embeddings.create({ model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small", input: [...input], encoding_format: "float" }, { signal: abortSignal(signal) });
    return response.data.map((x) => x.embedding);
  }
  summarize(input: OpenAIRequest) { return this.responses({ ...input, system: `${input.system}\nSummarize only the supplied evidence. State missing context explicitly.` }); }
  async recommend(input: OpenAIRequest): Promise<OpenAIResult<AIRecommendationOutput>> { return this.structured(input, recommendationSchema, "vayon_recommendation"); }
  async classify(input: OpenAIRequest, labels: readonly string[]): Promise<OpenAIResult<ClassifiedOutput>> {
    if (!labels.length) throw new Error("Classification labels are required.");
    return this.structured({ ...input, system: `${input.system}\nChoose exactly one of these labels: ${labels.join(", ")}.` }, classificationSchema, "vayon_classification");
  }
  async extract(input: OpenAIRequest, fields: readonly string[]): Promise<OpenAIResult<ExtractedOutput>> {
    if (!fields.length) throw new Error("Extraction fields are required.");
    return this.structured({ ...input, system: `${input.system}\nExtract only these fields: ${fields.join(", ")}. Use null when absent.` }, extractionSchema, "vayon_extraction");
  }
  async moderate(input: string, signal?: AbortSignal) {
    if (!input.trim()) throw new Error("Moderation input is required.");
    const api = this.api ?? client(configured());
    const response = await api.moderations.create({ model: "omni-moderation-latest", input }, { signal: abortSignal(signal) });
    const result = response.results[0];
    return { flagged: result?.flagged ?? false, categories: result ? Object.entries(result.categories).filter(([, value]) => value).map(([name]) => name) : [] };
  }
  async countTokens(input: string, model?: string): Promise<TokenUsage> { void model; const promptTokens = Math.ceil(input.length / 4); return { promptTokens, completionTokens: 0, totalTokens: promptTokens, estimated: true }; }
  estimateCost(model: string, promptTokens: number, completionTokens: number) { return this.models.estimate(model, promptTokens, completionTokens); }
  async *stream(input: OpenAIRequest): AsyncIterable<string> {
    this.validatePrompt(input);
    await this.ensureSafe(`${input.system}\n${input.prompt}`, input.signal);
    const model = this.models.resolve(input.model ?? this.configuration.model);
    const api = this.api ?? client(configured());
    if (!this.configuration.streaming) { const response = await this.responses(input); yield String(response.output); return; }
    const stream = await this.withModelFallback(model.id, async (modelId) => api.responses.create({ model: String(modelId), instructions: input.system, input: input.prompt, max_output_tokens: Math.min(input.maxOutputTokens ?? this.configuration.maxOutputTokens, model.maximumOutputTokens), store: false, stream: true, reasoning: { effort: this.configuration.reasoningLevel } }, { signal: abortSignal(input.signal) }));
    for await (const event of stream) if (event.type === "response.output_text.delta") yield event.delta;
  }
  private async structured<T>(input: OpenAIRequest, schema: z.ZodType<T>, name: string): Promise<OpenAIResult<T>> {
    this.validatePrompt(input);
    await this.ensureSafe(`${input.system}\n${input.prompt}`, input.signal);
    const model = this.models.resolve(input.model ?? this.configuration.model);
    const api = this.api ?? client(configured());
    const started = performance.now();
    const response = await this.withModelFallback(model.id, async (modelId) => api.responses.parse({ model: String(modelId), instructions: input.system, input: input.prompt, max_output_tokens: Math.min(input.maxOutputTokens ?? this.configuration.maxOutputTokens, model.maximumOutputTokens), store: false, reasoning: { effort: this.configuration.reasoningLevel }, text: { format: zodTextFormat(schema, name) } }, { signal: abortSignal(input.signal) }));
    if (!response.output_parsed) throw new Error("OpenAI returned no validated output.");
    const usage = this.usage(response.usage?.input_tokens, response.usage?.output_tokens);
    const usedModel = String(response.model ?? model.id);
    return { output: schema.parse(response.output_parsed), provider: "openai", model: usedModel, latencyMs: Math.round(performance.now() - started), usage, cost: this.models.estimate(usedModel, usage.promptTokens, usage.completionTokens), recommendationOnly: true, executionAllowed: false };
  }
  private async ensureSafe(input: string, signal?: AbortSignal) { const result = await this.moderate(input, signal); if (result.flagged) throw new Error("Prompt was blocked by content safety policy."); }
  private validatePrompt(input: OpenAIRequest) {
    if (!input.workspaceId) throw new Error("Workspace attribution is required.");
    if (!input.system.trim() || !input.prompt.trim()) throw new Error("System and user prompts are required.");
    const maximum = Number(process.env.OPENAI_MAX_PROMPT_CHARACTERS ?? 100_000);
    if (input.system.length + input.prompt.length > maximum) throw new Error("Prompt exceeds the configured maximum size.");
  }
  private async withModelFallback<T>(primary: string, request: (model: string) => Promise<T>): Promise<T> {
    try { return await request(primary); }
    catch (reason) {
      const diagnostic = classifyOpenAIHealthError(reason), fallback = this.configuration.fallbackModel;
      log("openai.request.failed", { diagnostic, model: primary, retryAttempts: 2 });
      if (!fallback || fallback === primary || !["model_unavailable", "provider_unavailable", "rate_limited", "timeout"].includes(diagnostic)) throw reason;
      log("openai.model.fallback", { diagnostic, primaryModel: primary, fallbackModel: String(fallback) });
      return request(String(fallback));
    }
  }
  private usage(input = 0, output = 0): TokenUsage { return { promptTokens: input, completionTokens: output, totalTokens: input + output, estimated: false }; }
}
