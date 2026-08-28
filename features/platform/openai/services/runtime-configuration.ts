import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OpenAIModelId } from "../domain/models";

export type OpenAIReasoningLevel = "minimal" | "low" | "medium" | "high";
export interface OpenAIRuntimeConfiguration {
  readonly defaultModel: OpenAIModelId;
  readonly model: OpenAIModelId;
  readonly fallbackModel: OpenAIModelId | null;
  readonly temperature: number | null;
  readonly maxOutputTokens: number;
  readonly reasoningLevel: OpenAIReasoningLevel;
  readonly streaming: boolean;
  readonly source: "workspace-configuration" | "environment-default";
}

type Context = { client: SupabaseClient; workspaceId: string };
type StoredConfiguration = Partial<{ model: string; fallbackModel: string; temperature: number; maxTokens: number; reasoningLevel: OpenAIReasoningLevel; streaming: boolean }>;
const levels = new Set<OpenAIReasoningLevel>(["minimal", "low", "medium", "high"]);
const finite = (value: unknown, fallback: number, min: number, max: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

export function environmentOpenAIConfiguration(): OpenAIRuntimeConfiguration {
  const defaultModel = (process.env.OPENAI_MODEL ?? "gpt-5.5") as OpenAIModelId;
  const fallbackModel = (process.env.OPENAI_FALLBACK_MODEL ?? "gpt-5") as OpenAIModelId;
  const requestedLevel = process.env.OPENAI_REASONING_LEVEL as OpenAIReasoningLevel | undefined;
  return Object.freeze({ defaultModel, model: defaultModel, fallbackModel: fallbackModel === defaultModel ? null : fallbackModel, temperature: process.env.OPENAI_TEMPERATURE ? finite(Number(process.env.OPENAI_TEMPERATURE), 0.2, 0, 2) : null, maxOutputTokens: finite(Number(process.env.OPENAI_MAX_OUTPUT_TOKENS), 4096, 16, 128_000), reasoningLevel: requestedLevel && levels.has(requestedLevel) ? requestedLevel : "medium", streaming: process.env.OPENAI_STREAMING !== "false", source: "environment-default" });
}

export class OpenAIRuntimeConfigurationService {
  constructor(private context: Context) {}
  async resolve(): Promise<OpenAIRuntimeConfiguration> {
    const defaults = environmentOpenAIConfiguration();
    const { data, error } = await this.context.client.from("integration_connections").select("configuration,integration_providers!inner(code)").eq("workspace_id", this.context.workspaceId).eq("integration_providers.code", "openai").is("deleted_at", null).maybeSingle();
    if (error) throw error;
    const stored = (data?.configuration ?? null) as StoredConfiguration | null;
    if (!stored) return defaults;
    return Object.freeze({ defaultModel: defaults.defaultModel, model: (stored.model?.trim() || defaults.model) as OpenAIModelId, fallbackModel: (stored.fallbackModel?.trim() || defaults.fallbackModel) as OpenAIModelId | null, temperature: stored.temperature === undefined ? defaults.temperature : finite(stored.temperature, 0.2, 0, 2), maxOutputTokens: finite(stored.maxTokens, defaults.maxOutputTokens, 16, 128_000), reasoningLevel: stored.reasoningLevel && levels.has(stored.reasoningLevel) ? stored.reasoningLevel : defaults.reasoningLevel, streaming: typeof stored.streaming === "boolean" ? stored.streaming : defaults.streaming, source: "workspace-configuration" });
  }
}
