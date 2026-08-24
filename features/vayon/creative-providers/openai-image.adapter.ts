import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { OpenAICreativeImageProvider } from "@/features/vayon/creative-studio/generation.provider";
import { OpenAIProvider } from "@/features/platform/openai/providers/openai.provider";
import type {
  CreativeAssetOutput,
  CreativeRuntimeRequest,
} from "@/features/vayon/creative-runtime/types";
import type {
  RuntimeAdapter,
  RuntimeAdapterContext,
} from "@/features/vayon/creative-execution/adapter";
export class OpenAIImageRuntimeAdapter implements RuntimeAdapter {
  readonly id = "openai-image";
  readonly capabilities = ["Image"] as const;
  constructor(
    private provider = new OpenAICreativeImageProvider(),
    private healthProvider = new OpenAIProvider(),
  ) {}
  generate(context: RuntimeAdapterContext, request: CreativeRuntimeRequest) {
    return this.execute(context, request, false);
  }
  edit(context: RuntimeAdapterContext, request: CreativeRuntimeRequest) {
    return this.execute(context, request, true);
  }
  async translate(): Promise<never> {
    throw new Error("Image translation is not supported.");
  }
  async export(): Promise<never> {
    throw new Error("Use the approved Image Studio export service.");
  }
  async validate(request: CreativeRuntimeRequest) {
    const issues: string[] = [];
    if (!request.workspaceId) issues.push("Workspace attribution is required.");
    if (!request.prompt.trim()) issues.push("An image prompt is required.");
    if (request.requestedBy !== "Image Studio")
      issues.push("The image adapter accepts Image Studio requests only.");
    return issues;
  }
  async health() {
    const health = await this.healthProvider.health();
    return {
      state: health.connected
        ? ("available" as const)
        : ("unavailable" as const),
      checkedAt: new Date().toISOString(),
      reason: health.reason ?? health.diagnostic,
    };
  }
  async estimate(request: CreativeRuntimeRequest) {
    return {
      estimatedCost:
        Number(process.env.OPENAI_IMAGE_ESTIMATED_COST_USD ?? 0) || null,
      estimatedLatencyMs: null,
      outputCount: request.outputCount,
      currency: "USD",
    };
  }
  private async execute(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
    editing: boolean,
  ): Promise<readonly CreativeAssetOutput[]> {
    const size =
        request.aspectRatio === "portrait"
          ? "1024x1536"
          : request.aspectRatio === "landscape"
            ? "1536x1024"
            : "1024x1024",
      quality = request.quality === "premium" ? "high" : "medium",
      client = createSupabaseServiceClient();
    let result;
    if (editing) {
      if (!request.targetAssetId)
        throw new Error("A source asset is required for image editing.");
      const { data: asset, error } = await client
        .from("creative_assets")
        .select("storage_path")
        .eq("organization_id", context.organizationId)
        .eq("workspace_id", context.workspaceId)
        .eq("id", request.targetAssetId)
        .single();
      if (error || !asset?.storage_path)
        throw new Error("The source image is unavailable in this workspace.");
      const download = await client.storage
        .from("vayon-assets")
        .download(String(asset.storage_path));
      if (download.error)
        throw new Error("The source image could not be loaded.");
      result = await this.provider.edit({
        prompt: request.prompt,
        size,
        quality,
        workspaceId: context.workspaceId,
        image: new Uint8Array(await download.data.arrayBuffer()),
      });
    } else
      result = await this.provider.generate({
        prompt: request.prompt,
        size,
        quality,
        workspaceId: context.workspaceId,
      });
    const path = `${context.organizationId}/${context.workspaceId}/creative-assets/${request.id}/${crypto.randomUUID()}.png`,
      upload = await client.storage
        .from("vayon-assets")
        .upload(path, result.bytes, {
          contentType: result.mimeType,
          upsert: false,
        });
    if (upload.error) throw new Error("Generated image storage failed.");
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
          storagePath: path,
          mimeType: result.mimeType,
          model: result.model,
          latencyMs: result.latencyMs,
          revisedPrompt: result.revisedPrompt ?? null,
          operation: editing ? "edit" : "generate",
          correlationId: context.correlationId,
          estimatedCostUsd: Number(
            process.env.OPENAI_IMAGE_ESTIMATED_COST_USD ?? 0,
          ),
        },
      },
    ];
  }
}
