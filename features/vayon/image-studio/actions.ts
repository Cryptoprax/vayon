"use server";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import { creativeStudioAccess } from "@/features/vayon/creative-studio/access.service";
import { createLiveCreativeExecutionService } from "@/features/vayon/creative-providers/execution.factory";
import { ImageStudioService } from "./service";
import { buildImagePrompt } from "./prompt-builder";
import type {
  AiEditOperation,
  ImageExecutionSubmission,
  ImageGenerationRequest,
} from "./types";
export async function generateImage(
  input: ImageGenerationRequest,
): Promise<ImageExecutionSubmission> {
  return execute(input, null);
}
export async function editImage(
  input: ImageGenerationRequest,
  targetAssetId: string,
  operation: AiEditOperation,
): Promise<ImageExecutionSubmission> {
  return execute(
    { ...input, prompt: `${operation}. ${input.prompt}` },
    targetAssetId,
  );
}
async function execute(
  input: ImageGenerationRequest,
  targetAssetId: string | null,
): Promise<ImageExecutionSubmission> {
  const context = await requireWorkspacePermission(
    "creative_studio",
    targetAssetId ? "update" : "create",
  );
  if (!input.projectId || !input.campaignId)
    throw new Error(
      "Project and campaign are required for governed asset storage.",
    );
  const service = await ImageStudioService.production(),
    snapshot = service ? await service.snapshot() : null,
    campaign =
      snapshot?.campaigns.find((item) => item.id === input.campaignId)?.name ??
      null,
    prompt = buildImagePrompt(input, snapshot?.brand ?? null, campaign),
    now = new Date().toISOString(),
    requestId = crypto.randomUUID(),
    result = await createLiveCreativeExecutionService().accept({
      id: `image-${requestId}`,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      capability: "Image",
      state: "Queued",
      priority: "normal",
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 120_000,
      cancellationRequested: false,
      correlationId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      request: {
        id: requestId,
        prompt,
        workspaceId: context.workspaceId,
        projectId: input.projectId,
        brandId: input.brandId,
        campaignId: input.campaignId,
        targetAssetId,
        imageType: input.type,
        style: input.style,
        aspectRatio: "landscape",
        outputCount: 1,
        language: "visual",
        quality: "premium",
        priority: "normal",
        requiredCapability: targetAssetId ? "edit_images" : "generate_images",
        requestedBy: "Image Studio",
      },
    }),
    output = result.outputs[0],
    storagePath =
      typeof output?.metadata.storagePath === "string"
        ? output.metadata.storagePath
        : null;
  if (!storagePath)
    return {
      status: result.status,
      assetId: null,
      storagePath: null,
      provider: result.provider,
      warnings: result.warnings,
      errors: result.errors,
      latencyMs: result.metadata.latencyMs,
      estimatedCost: result.metadata.estimatedCost,
    };
  const access = await creativeStudioAccess();
  if (!access) throw new Error("Creative Studio access is required.");
  const {
    data: { user },
  } = await access.client.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const assetId = crypto.randomUUID(),
    { error } = await access.client
      .from("creative_assets")
      .insert({
        id: assetId,
        organization_id: context.organizationId,
        workspace_id: context.workspaceId,
        campaign_id: input.campaignId,
        project_id: input.projectId,
        name: `${input.type} · AI draft`,
        category: "image",
        format: "PNG",
        platform: "Image Studio",
        language: "visual",
        status: "draft",
        prompt: input.prompt,
        ai_employee: "Creative AI",
        edits: targetAssetId ? [targetAssetId] : [],
        exports: ["PNG", "JPG", "WEBP", "TIFF", "PDF"],
        publishing_history: [],
        generated_at: now,
        created_by: user.id,
        version: 1,
        storage_path: storagePath,
        mime_type: "image/png",
        model: output?.metadata.model ?? null,
        reasoning_summary:
          "Generated through Creative Runtime and pending Brand Reviewer approval.",
      });
  if (error) throw error;
  return {
    status: result.status,
    assetId,
    storagePath,
    provider: result.provider,
    warnings: result.warnings,
    errors: result.errors,
    latencyMs:
      typeof output?.metadata.latencyMs === "number"
        ? output.metadata.latencyMs
        : null,
    estimatedCost:
      typeof output?.metadata.estimatedCostUsd === "number"
        ? output.metadata.estimatedCostUsd
        : null,
  };
}
