"use server";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { creativeStudioAccess } from "@/features/vayon/creative-studio/access.service";
import { createLiveCreativeExecutionService } from "@/features/vayon/creative-providers/execution.factory";
import { VideoStudioService } from "./service";
import { buildVideoPrompt } from "./prompt-builder";
import type {
  VideoEditOperation,
  VideoSubmission,
  VideoWizardInput,
} from "./types";
export async function generateVideo(
  input: VideoWizardInput,
): Promise<VideoSubmission> {
  return execute(input, null, null);
}
export async function editVideo(
  input: VideoWizardInput,
  targetAssetId: string,
  operation: VideoEditOperation,
): Promise<VideoSubmission> {
  return execute(
    { ...input, prompt: `${operation}. ${input.prompt}` },
    targetAssetId,
    operation,
  );
}
async function execute(
  input: VideoWizardInput,
  targetAssetId: string | null,
  operation: VideoEditOperation | null,
): Promise<VideoSubmission> {
  const context = await requireWorkspacePermission(
    "creative_studio",
    targetAssetId ? "update" : "create",
  );
  if (!input.projectId || !input.campaignId)
    throw new Error(
      "Project and campaign are required for governed video storage.",
    );
  const studio = await VideoStudioService.production(),
    snapshot = studio ? await studio.snapshot() : null,
    campaign =
      snapshot?.campaigns.find((item) => item.id === input.campaignId)?.name ??
      null,
    execution = createLiveCreativeExecutionService(),
    now = new Date().toISOString(),
    planId = crypto.randomUUID(),
    plan = await execution.accept({
      id: `storyboard-${planId}`,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      capability: "Document",
      state: "Queued",
      priority: "normal",
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 60_000,
      cancellationRequested: false,
      correlationId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      request: {
        id: planId,
        prompt: `Create a factual scene plan, voiceover script, subtitles, CTA, and thumbnail direction for: ${input.prompt}. Duration ${input.duration} seconds. Do not invent business facts.`,
        workspaceId: context.workspaceId,
        projectId: input.projectId,
        brandId: input.brandId,
        campaignId: input.campaignId,
        targetAssetId: null,
        imageType: null,
        style: input.tone,
        aspectRatio: "document",
        outputCount: 1,
        language: input.language,
        quality: "premium",
        priority: "normal",
        requiredCapability: "generate_video",
        requestedBy: "Document Studio",
      },
    }),
    storyboard =
      typeof plan.outputs[0]?.metadata.content === "string"
        ? plan.outputs[0].metadata.content
        : null;
  if (!storyboard) return summary(plan, null);
  const prompt = buildVideoPrompt(
      input,
      snapshot?.brand ?? null,
      campaign,
      storyboard,
    ),
    id = crypto.randomUUID(),
    result = await execution.accept({
      id: `video-${id}`,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      capability: "Video",
      state: "Queued",
      priority: "normal",
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 600_000,
      cancellationRequested: false,
      correlationId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      request: {
        id,
        prompt,
        workspaceId: context.workspaceId,
        projectId: input.projectId,
        brandId: input.brandId,
        campaignId: input.campaignId,
        targetAssetId,
        imageType: "Video",
        style: input.tone,
        aspectRatio:
          input.aspectRatio === "Portrait" ? "portrait" : "landscape",
        outputCount: 1,
        language: input.language,
        quality: "premium",
        priority: "normal",
        requiredCapability: "generate_video",
        requestedBy: "Creative Director",
      },
    }),
    output = result.outputs[0],
    path =
      typeof output?.metadata.storagePath === "string"
        ? output.metadata.storagePath
        : null;
  if (!path) return summary(result, null);
  const access = await creativeStudioAccess();
  if (!access) throw new Error("Creative Studio access is required.");
  const {
    data: { user },
  } = await access.client.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const assetId = crypto.randomUUID(),
    { error } = await access.client.from("creative_assets").insert({
      id: assetId,
      organization_id: context.organizationId,
      workspace_id: context.workspaceId,
      campaign_id: input.campaignId,
      project_id: input.projectId,
      name: `${input.output} · AI draft`,
      category: "video",
      format: "MP4",
      platform: input.platform,
      language: input.language,
      status: "draft",
      prompt: input.prompt,
      ai_employee: "Creative AI",
      edits: targetAssetId
        ? [`${operation ?? "Video edit"}:${targetAssetId}`]
        : [],
      exports: [
        "MP4",
        "MOV",
        "WEBM",
        "GIF Preview",
        "Storyboard PDF",
        "Subtitle SRT",
      ],
      publishing_history: [],
      storyboard: {
        content: storyboard,
        providerVideoId: output?.metadata.providerVideoId,
        thumbnailPath: output?.metadata.thumbnailPath,
        durationRequested: input.duration,
        versionOf: targetAssetId,
      },
      generated_at: now,
      created_by: user.id,
      version: 1,
      storage_path: path,
      mime_type: "video/mp4",
      model: output?.metadata.model ?? null,
      reasoning_summary:
        "Generated through Creative Runtime and pending Brand Reviewer approval.",
    });
  if (error) throw error;
  return summary(result, assetId);
}
function summary(
  result: Awaited<
    ReturnType<ReturnType<typeof createLiveCreativeExecutionService>["accept"]>
  >,
  assetId: string | null,
): VideoSubmission {
  const output = result.outputs[0];
  return {
    status: result.status,
    assetId,
    provider: result.provider,
    latencyMs:
      typeof output?.metadata.latencyMs === "number"
        ? output.metadata.latencyMs
        : null,
    estimatedCost:
      typeof output?.metadata.estimatedCostUsd === "number"
        ? output.metadata.estimatedCostUsd
        : null,
    warnings: result.warnings,
    errors: result.errors,
  };
}
