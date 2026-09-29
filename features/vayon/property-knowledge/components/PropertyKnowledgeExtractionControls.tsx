import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import type { PropertyKnowledgeDocument } from "../domain/types";
import { extractPropertyKnowledgeDocumentAction } from "../actions/property-knowledge-extraction.actions";

/**
 * Phase K2: honest extraction status. Extraction is only text processing --
 * this never labels a document as AI knowledge, verified facts, or indexed.
 * Extracted text is untrusted source content and is shown read-only.
 */
export function extractionLabel(document: Pick<PropertyKnowledgeDocument, "extractionStatus" | "extractionErrorCode">): string {
  switch (document.extractionStatus) {
    case "pending": return "Not processed";
    case "processing": return "Processing";
    case "completed": return "Ready";
    case "not_supported": return "OCR required / unsupported";
    case "failed":
      return document.extractionErrorCode === "NO_EXTRACTABLE_TEXT" ? "OCR required / no text found" : `Failed (${document.extractionErrorCode ?? "EXTRACTION_FAILED"})`;
  }
}

export function PropertyKnowledgeExtractionControls({
  propertyId,
  document,
  canManage,
}: {
  propertyId: string;
  document: PropertyKnowledgeDocument;
  canManage: boolean;
}) {
  const staleProcessing = document.extractionStale;
  const canExtract = canManage && document.status !== "archived" && (document.extractionStatus === "pending" || staleProcessing);
  const canRetry = canManage && document.status !== "archived" && document.extractionStatus === "failed" && document.extractionErrorCode !== "NO_EXTRACTABLE_TEXT";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-vds-border pt-3 text-xs">
      <span className="text-vds-muted">Text extraction: {extractionLabel(document)}</span>
      {document.extractionStatus === "completed" && (
        <Link href={`/vayon/properties/${propertyId}/documents/${document.id}`} className="focus-ring rounded-lg border border-vds-border px-3 py-2">
          View Extracted Text
        </Link>
      )}
      {(canExtract || canRetry) && (
        <form action={extractPropertyKnowledgeDocumentAction}>
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="documentId" value={document.id} />
          <Button type="submit" variant="ghost">{canRetry || staleProcessing ? "Retry Extraction" : "Extract Text"}</Button>
        </form>
      )}
    </div>
  );
}
