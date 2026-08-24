import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type {
  CreativeAssetOutput,
  CreativeRuntimeRequest,
} from "@/features/vayon/creative-runtime/types";
import type {
  RuntimeAdapter,
  RuntimeAdapterContext,
} from "@/features/vayon/creative-execution/adapter";
import { OpenAIVideoProvider } from "./openai-video.provider";
export class OpenAIVideoRuntimeAdapter implements RuntimeAdapter {
  readonly id = "openai-video";
  readonly capabilities = ["Video"] as const;
  constructor(private provider = new OpenAIVideoProvider()) {}
  generate(context: RuntimeAdapterContext, request: CreativeRuntimeRequest) {
    return this.execute(context, request, false);
  }
  edit(context: RuntimeAdapterContext, request: CreativeRuntimeRequest) {
    return this.execute(context, request, true);
  }
  async translate(): Promise<never> {
    throw new Error("Use the video editing workflow for subtitle translation.");
  }
  async export(): Promise<never> {
    throw new Error("Use the approved Video Studio export service.");
  }
  async validate(request: CreativeRuntimeRequest) {
    const issues: string[] = [];
    if (!request.workspaceId) issues.push("Workspace attribution is required.");
    if (!request.prompt.trim()) issues.push("A video prompt is required.");
    if (request.requestedBy !== "Creative Director")
      issues.push("The video adapter accepts Creative Director requests only.");
    return issues;
  }
  async health() {
    const health = await this.provider.health();
    return {
      state: health.available
        ? ("available" as const)
        : ("unavailable" as const),
      checkedAt: new Date().toISOString(),
      reason: health.reason,
    };
  }
  async estimate(request: CreativeRuntimeRequest) {
    return {
      estimatedCost:
        Number(process.env.OPENAI_VIDEO_ESTIMATED_COST_USD ?? 0) || null,
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
    const client = createSupabaseServiceClient();
    let sourceVideoId: string | undefined;
    if (editing) {
      if (!request.targetAssetId)
        throw new Error("A source asset is required for video editing.");
      const { data, error } = await client
        .from("creative_assets")
        .select("storyboard")
        .eq("organization_id", context.organizationId)
        .eq("workspace_id", context.workspaceId)
        .eq("id", request.targetAssetId)
        .single();
      const metadata = data?.storyboard as { providerVideoId?: string } | null;
      if (error || !metadata?.providerVideoId)
        throw new Error("The source video provider reference is unavailable.");
      sourceVideoId = metadata.providerVideoId;
    }
    const result = await this.provider.generate({
        prompt: request.prompt,
        seconds: "12",
        size: request.aspectRatio === "portrait" ? "720x1280" : "1280x720",
        signal: context.signal,
        sourceVideoId,
      }),
      base = `${context.organizationId}/${context.workspaceId}/creative-assets/${request.id}`,
      path = `${base}/${crypto.randomUUID()}.mp4`,
      upload = await client.storage
        .from("vayon-assets")
        .upload(path, result.bytes, {
          contentType: "video/mp4",
          upsert: false,
        });
    if (upload.error) throw new Error("Generated video storage failed.");
    let thumbnailPath: string | null = null;
    if (result.thumbnail) {
      thumbnailPath = `${base}/${crypto.randomUUID()}.webp`;
      const thumb = await client.storage
        .from("vayon-assets")
        .upload(thumbnailPath, result.thumbnail, {
          contentType: "image/webp",
          upsert: false,
        });
      if (thumb.error) thumbnailPath = null;
    }
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
          thumbnailPath,
          mimeType: "video/mp4",
          providerVideoId: result.videoId,
          model: result.model,
          seconds: result.seconds,
          size: result.size,
          latencyMs: result.latencyMs,
          operation: editing ? "edit" : "generate",
          correlationId: context.correlationId,
          estimatedCostUsd: Number(
            process.env.OPENAI_VIDEO_ESTIMATED_COST_USD ?? 0,
          ),
        },
      },
    ];
  }
}
