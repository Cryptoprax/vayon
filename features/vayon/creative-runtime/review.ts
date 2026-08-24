import type { CreativeRuntimeRequest, QualityReview } from "./types";
export function reviewCreativeRequest(
  request: CreativeRuntimeRequest,
  brandReady: boolean,
  providerResponded: boolean,
): QualityReview {
  const reasons: string[] = [];
  if (!request.prompt.trim()) reasons.push("Prompt is required.");
  if (!request.projectId) reasons.push("Project association is missing.");
  if (!request.brandId) reasons.push("Brand association is missing.");
  return {
    brandConsistency: brandReady ? "pass" : "review",
    assetCompleteness: request.outputCount > 0 ? "pass" : "review",
    promptQuality: request.prompt.trim().length >= 12 ? "pass" : "review",
    metadataCompleteness:
      request.workspaceId && request.aspectRatio && request.language
        ? "pass"
        : "review",
    providerResponse: providerResponded ? "pass" : "unavailable",
    automatedJudgement: false,
    reasons,
  };
}
