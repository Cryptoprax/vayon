import type { EditableDocumentModel } from "./types";
export interface DocumentQualityReview {
  readonly requiredSections: "pass" | "review";
  readonly brandConsistency: "pass" | "review";
  readonly missingInformation: readonly string[];
  readonly toneConsistency: "pass" | "review";
  readonly formattingCompleteness: "pass" | "review";
  readonly editableDraft: true;
}
export function reviewDocument(
  document: EditableDocumentModel,
  required: { readonly brandId: string | null; readonly tone: string },
): DocumentQualityReview {
  const text = document.sections
      .flatMap((section) => section.blocks.map((block) => block.content))
      .join(" "),
    missing = [...text.matchAll(/Not supplied|information required/gi)].map(
      (match) => match[0],
    );
  return {
    requiredSections: document.sections.length > 1 ? "pass" : "review",
    brandConsistency:
      required.brandId && document.brandId === required.brandId
        ? "pass"
        : "review",
    missingInformation: [...new Set(missing)],
    toneConsistency: required.tone.trim() ? "pass" : "review",
    formattingCompleteness: document.sections.every(
      (section) => section.title && section.blocks.length,
    )
      ? "pass"
      : "review",
    editableDraft: true,
  };
}
