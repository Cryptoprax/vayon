"use server";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";
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
await guardSubscriptionAction();

  return execute(input, null);
}
export async function editImage(
  input: ImageGenerationRequest,
  targetAssetId: string,
  operation: AiEditOperation,
): Promise<ImageExecutionSubmission> {
await guardSubscriptionAction();

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
  const access = await creativeStudioAccess();
  if (!access) throw new Error("Creative Studio access is required.");
  const service = await ImageStudioService.production(),
    snapshot = service ? await service.snapshot() : null,
    campaign =
      snapshot?.campaigns.find((item) => item.id === input.campaignId)?.name ??
      null,
    prompt = buildImagePrompt(input, snapshot?.brand ?? null, campaign),
    now = new Date().toISOString(),
    requestId = crypto.randomUUID();
  // ADS-B0E: generateImage and editImage both funnel through this shared
  // execute() before ever reaching the expensive OpenAI image call --
  // exactly one guard here covers both. The claim happens as the LAST step
  // before the real provider call, after authentication
  // (requireWorkspacePermission above), the subscription guard
  // (guardSubscriptionAction, called by both public entry points before
  // execute()), and the project/campaign presence check -- nothing between
  // a successful claim and the accept() call below can fail, so a
  // successful claim always corresponds to a real provider invocation
  // actually being attempted. See the migration's own comment for why every
  // call (including a user re-submitting after a failure) claims quota --
  // there is no job/retry queue here, so each execute() call is its own
  // independent, legitimately-billable attempt.
  const { error: quotaError } = await access.client.rpc("claim_creative_generation_quota", {
    p_workspace_id: context.workspaceId,
    p_organization_id: context.organizationId,
    p_metric: "image_generations",
  });
  if (quotaError) throw quotaError;
  const result = await createLiveCreativeExecutionService().accept({
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
