import { Button } from "@/features/platform/design-system";
import type { PropertyKnowledgeDocument } from "../domain/types";
import { propertyKnowledgeDocumentTypes } from "../domain/types";
import { PropertyKnowledgeExtractionControls } from "./PropertyKnowledgeExtractionControls";
import {
  approvePropertyKnowledgeDocumentAction,
  archivePropertyKnowledgeDocumentAction,
  uploadPropertyKnowledgeDocumentAction,
} from "../actions/property-knowledge-document.actions";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";

const documentTypeLabels: Record<string, string> = {
  brochure: "Brochure",
  price_sheet: "Price sheet",
  floor_plan: "Floor plan",
  master_plan: "Master plan",
  amenities: "Amenities",
  location: "Location",
  faq: "FAQ",
  specification: "Specification",
  payment_plan: "Payment plan",
  legal: "Legal",
  other: "Other",
};

/**
 * Phase K1: property-scoped documents only. This section deliberately never
 * claims a document is "AI-indexed" or "extraction complete" -- K1 stores
 * and trust-gates files only. No text extraction, retrieval, or AI
 * connection exists yet (see K2+).
 */
export function PropertyKnowledgeDocuments({
  propertyId,
  documents,
  documentUrls,
  canManage,
}: {
  propertyId: string;
  documents: readonly PropertyKnowledgeDocument[];
  documentUrls: Readonly<Record<string, string>>;
  canManage: boolean;
}) {
  return (
    <div className="space-y-5">
      <section className={card} aria-labelledby="property-knowledge-heading">
        <h2 id="property-knowledge-heading" className="font-semibold">Knowledge / Documents</h2>
        <p className="mt-2 text-sm text-vds-muted">
          Store brochures, price sheets, floor plans, and other reference documents for this property. Documents are
          stored as uploaded. Text extraction is processing only: extracted text is untrusted source content and is not searched or connected to AI.
        </p>

        {canManage && (
          <form action={uploadPropertyKnowledgeDocumentAction} encType="multipart/form-data" className="mt-5 space-y-3 rounded-xl border border-vds-border p-4">
            <input type="hidden" name="propertyId" value={propertyId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs text-vds-muted">Document type</span>
                <select name="documentType" required defaultValue="brochure" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                  {propertyKnowledgeDocumentTypes.map((type) => (
                    <option key={type} value={type}>{documentTypeLabels[type] ?? type}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-vds-muted">Title</span>
                <input type="text" name="title" maxLength={200} placeholder="e.g. September price sheet" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm" />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-vds-muted">File (PDF, DOCX, TXT, Markdown, PNG, or JPEG, up to 20 MB)</span>
              <input type="file" name="file" required accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg" className="w-full text-sm" />
            </label>
            <Button type="submit" variant="primary">Upload document</Button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          {documents.length ? (
            documents.map((document) => (
              <article key={document.id} className="rounded-xl border border-vds-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{document.title}</p>
                    <p className="mt-1 text-xs text-vds-muted">
                      {documentTypeLabels[document.documentType] ?? document.documentType} · {document.status}
                      {document.supersededBy ? " · superseded" : ""} · uploaded {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {documentUrls[document.id] && (
                      <a href={documentUrls[document.id]} target="_blank" rel="noreferrer" className="focus-ring rounded-lg border border-vds-border px-3 py-2 text-xs">
                        View
                      </a>
                    )}
                    {canManage && (document.status === "uploaded" || document.status === "review") && (
                      <form action={approvePropertyKnowledgeDocumentAction}>
                        <input type="hidden" name="propertyId" value={propertyId} />
                        <input type="hidden" name="documentId" value={document.id} />
                        <Button type="submit" variant="ghost">Approve</Button>
                      </form>
                    )}
                    {canManage && document.status !== "archived" && (
                      <form action={archivePropertyKnowledgeDocumentAction}>
                        <input type="hidden" name="propertyId" value={propertyId} />
                        <input type="hidden" name="documentId" value={document.id} />
                        <Button type="submit" variant="ghost" className="text-vds-danger">Archive</Button>
                      </form>
                    )}
                  </div>
                </div>
                <PropertyKnowledgeExtractionControls propertyId={propertyId} document={document} canManage={canManage} />
              </article>
            ))
          ) : (
            <p className="text-sm text-vds-muted">No documents have been uploaded for this property yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
