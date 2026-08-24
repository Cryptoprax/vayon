import "server-only";
import { OpenAIProvider } from "@/features/platform/openai/providers/openai.provider";
import type {
  CreativeAssetOutput,
  CreativeRuntimeRequest,
} from "@/features/vayon/creative-runtime/types";
import type {
  RuntimeAdapter,
  RuntimeAdapterContext,
} from "@/features/vayon/creative-execution/adapter";

export class OpenAIDocumentAdapter implements RuntimeAdapter {
  readonly id = "openai-document";
  readonly capabilities = ["Document", "Translation"] as const;
  constructor(private provider = new OpenAIProvider()) {}
  async generate(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ) {
    return this.execute(
      context,
      request,
      "Generate an editable document draft. Never invent missing business facts; mark them as information required.",
    );
  }
  async edit(context: RuntimeAdapterContext, request: CreativeRuntimeRequest) {
    return this.execute(
      context,
      request,
      "Edit only the supplied document block while preserving its meaning and factual boundaries.",
    );
  }
  async translate(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ) {
    return this.execute(
      context,
      request,
      "Translate the supplied document content accurately into the requested language.",
    );
  }
  async export(): Promise<readonly CreativeAssetOutput[]> {
    throw new Error("Document rendering requires an approved export adapter.");
  }
  async validate(request: CreativeRuntimeRequest) {
    const issues: string[] = [];
    if (!request.workspaceId) issues.push("Workspace attribution is required.");
    if (!request.prompt.trim()) issues.push("A document prompt is required.");
    if (request.requestedBy !== "Document Studio")
      issues.push(
        "The document adapter accepts Document Studio requests only.",
      );
    return issues;
  }
  async health() {
    const health = await this.provider.health();
    return {
      state: health.connected
        ? ("available" as const)
        : ("unavailable" as const),
      checkedAt: new Date().toISOString(),
      reason: health.reason ?? health.diagnostic,
    };
  }
  async estimate(request: CreativeRuntimeRequest) {
    const usage = await this.provider.countTokens(request.prompt),
      model = process.env.OPENAI_MODEL ?? "gpt-5",
      cost = this.provider.estimateCost(
        model,
        usage.promptTokens,
        Math.min(4096, Math.max(800, usage.promptTokens)),
      );
    return {
      estimatedCost: cost.totalUsd,
      estimatedLatencyMs: null,
      outputCount: request.outputCount,
      currency: "USD",
    };
  }
  async *stream(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ) {
    for await (const delta of this.provider.stream(
      this.providerRequest(
        context,
        request,
        "Generate an editable document draft. Never invent missing business facts; mark them as information required.",
      ),
    ))
      yield delta;
  }
  private async execute(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
    instruction: string,
  ): Promise<readonly CreativeAssetOutput[]> {
    const result = await this.provider.responses(
      this.providerRequest(context, request, instruction),
    );
    return [
      {
        id: crypto.randomUUID(),
        workspaceId: context.workspaceId,
        projectId: request.projectId,
        campaignId: request.campaignId,
        brandId: request.brandId,
        creativeDirectorTaskId: request.id,
        assetLibraryId: null,
        providerId: this.id,
        metadata: {
          content: result.output,
          model: result.model,
          latencyMs: result.latencyMs,
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
          estimatedCostUsd: result.cost.totalUsd,
          correlationId: context.correlationId,
        },
      },
    ];
  }
  private providerRequest(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
    instruction: string,
  ) {
    return {
      system: `You are VAYON Creative Director. ${instruction} Return structured Markdown with clear sections suitable for conversion into editable blocks.`,
      prompt: request.prompt,
      workspaceId: context.workspaceId,
      employee: "marketing-ai" as const,
      signal: context.signal,
      maxOutputTokens: Number(
        process.env.OPENAI_DOCUMENT_MAX_OUTPUT_TOKENS ?? 4096,
      ),
    };
  }
}
