"use server";
import { createLiveCreativeExecutionService } from "@/features/vayon/creative-providers/execution.factory";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
import { requireWorkspacePermission } from "@/features/platform/permissions/runtime/permission.service";
import type { DocumentSubmission, DocumentWizardInput } from "./types";
import { buildDocumentPrompt } from "./prompt-builder";
import { parseGeneratedDocument } from "./parser";
import { reviewDocument } from "./quality-review";
export async function generateDocument(
  input: DocumentWizardInput,
): Promise<DocumentSubmission> {
  const context = await requireWorkspacePermission("creative_studio", "create"),
    now = new Date().toISOString(),
    id = crypto.randomUUID();
  const brandService = await BrandStudioService.production(),
    brandSnapshot = brandService ? await brandService.snapshot() : null,
    brandRecord =
      brandSnapshot?.brands.find((item) => item.id === input.brandId) ?? null;
  const prompt = buildDocumentPrompt({
    workspaceId: context.workspaceId,
    campaign: input.campaignId,
    brand: brandRecord
      ? {
          name: brandRecord.name,
          voice: brandRecord.profile.toneOfVoice,
          colours: brandRecord.profile.colors
            ? Object.values(brandRecord.profile.colors)
            : [],
          typography: brandRecord.profile.typography,
          mission: brandRecord.profile.mission || null,
          vision: brandRecord.profile.vision || null,
          ctaStyle: brandRecord.profile.ctaStyle || null,
          legalFooter: brandRecord.profile.legalDisclaimers[0] ?? null,
        }
      : null,
    input,
  });
  const result = await createLiveCreativeExecutionService().accept({
    id: `document-${id}`,
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
      id,
      prompt,
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
      requiredCapability: "generate_images",
      requestedBy: "Document Studio",
    },
  });
  const content = result.outputs[0]?.metadata.content;
  if (typeof content !== "string")
    return { result, document: null, review: null };
  const document = parseGeneratedDocument({
    id,
    title: `${input.company} ${input.documentType}`,
    type: input.documentType,
    content,
    workspaceId: context.workspaceId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    brandId: input.brandId,
  });
  return {
    result,
    document,
    review: reviewDocument(document, {
      brandId: input.brandId,
      tone: input.tone,
    }),
  };
}

export async function editDocumentBlock(
  input: DocumentWizardInput,
  content: string,
  instruction: string,
) {
  if (!content.trim()) throw new Error("Editable block content is required.");
  return generateDocument({
    ...input,
    prompt: `Creative edit operation: ${instruction}\n\nSource block:\n${content}\n\nReturn only the revised block without adding facts.`,
  });
}
