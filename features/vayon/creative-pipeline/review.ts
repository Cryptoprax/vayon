import type { CreativeDocument, PipelineReview } from "./types";
export function reviewDocument(document: CreativeDocument): PipelineReview {
  const missingAssets = document.pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.blocks
          .filter((block) => block.type === "image" && !block.content.assetId)
          .map((block) => block.id),
      ),
    ),
    brokenReferences = document.pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.blocks
          .filter((block) => !block.brandReference)
          .map((block) => block.id),
      ),
    );
  return {
    brandValidation:
      document.brandId && brokenReferences.length === 0 ? "pass" : "review",
    completeness:
      document.pages.length && missingAssets.length === 0 ? "pass" : "review",
    missingAssets,
    brokenReferences,
    typographyCheck: "review",
    colourCheck: "review",
    approvalRequirements: [
      "Internal Review",
      "Brand Validation",
      "Management Approval",
    ],
    automatedJudgement: false,
  };
}
