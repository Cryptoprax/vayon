import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import { PropertyKnowledgeExtractionService } from "@/features/vayon/property-knowledge/services/property-knowledge-extraction.service";

export const dynamic = "force-dynamic";

/**
 * Read-only review of extracted document text. The text is untrusted source
 * content rendered as an escaped literal string inside <pre> -- never as
 * HTML or Markdown -- and is not AI knowledge, verified facts, or indexed.
 */
export default async function Page({ params }: { params: Promise<{ propertyId: string; documentId: string }> }) {
  const { propertyId, documentId } = await params;
  const permission = await new WorkspacePermissionService().check("knowledge", "view").catch(() => ({ decision: { allowed: false } }));
  const base = `/vayon/properties/${encodeURIComponent(propertyId)}?tab=knowledge`;
  if (!permission.decision.allowed) {
    return <div className="py-4"><p className="text-sm text-vds-muted">You do not have permission to view property knowledge documents.</p></div>;
  }
  const extracted = await (await PropertyKnowledgeExtractionService.production()).getExtractedText(documentId);
  if (!extracted || extracted.propertyId !== propertyId) notFound();
  return (
    <div className="min-w-0 py-4">
      <Link href={base} className="focus-ring text-xs text-vds-muted">Back to property documents</Link>
      <section className="mt-3 rounded-2xl border border-vds-border p-5" aria-labelledby="extracted-text-heading">
        <h1 id="extracted-text-heading" className="text-lg font-semibold">Extracted document text</h1>
        <p className="mt-1 break-words text-sm text-vds-muted">{extracted.title} · {extracted.characterCount.toLocaleString()} characters</p>
        <p className="mt-3 text-xs text-vds-muted">
          This is the raw text pulled from the uploaded file, shown read-only for your review. It is untrusted source content: it has not been
          verified, is not connected to AI, and does not change any property, price or CRM record. If it is wrong, archive or replace the source document.
        </p>
        <pre className="mt-4 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-vds-border p-4 text-sm">{extracted.text}</pre>
      </section>
    </div>
  );
}
