import { Button } from "@/features/platform/design-system";
import Link from "next/link";
import type { PropertyKnowledgeRetrievalResult } from "../retrieval/types";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
const coverageLabel = { full: "Fully supported", partial: "Partially supported", none: "No verified information" } as const;

/**
 * Human validation surface for K4 retrieval. Snippets are literal, untrusted
 * document text rendered as escaped plain text; the current approved price is
 * shown separately as the authoritative value. Nothing here is generated.
 */
export function PropertyKnowledgeSearch({
  propertyId,
  queryText,
  error,
  result,
  documentUrls,
}: {
  propertyId: string;
  queryText: string;
  error?: string;
  result: PropertyKnowledgeRetrievalResult | null;
  documentUrls: Readonly<Record<string, string>>;
}) {
  return (
    <section className={card} aria-labelledby="knowledge-search-heading">
      <h2 id="knowledge-search-heading" className="font-semibold">Search approved knowledge</h2>
      <p className="mt-2 text-sm text-vds-muted">
        Searches approved documents whose text has been extracted. Results are excerpts of your own documents, not answers.
      </p>
      <p className="mt-2 text-xs"><Link className="focus-ring underline" href={`/vayon/ai/workforce/sales-ai?propertyId=${encodeURIComponent(propertyId)}`}>Ask the sales assistant about this property</Link></p>
      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="tab" value="knowledge" />
        <input type="search" name="q" defaultValue={queryText} maxLength={300} placeholder="e.g. parking, payment plan, possession" className="min-w-0 flex-1 rounded-lg border border-vds-border bg-vds-background p-2 text-sm" />
        <Button type="submit" variant="ghost">Search</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-vds-danger">{error}</p>}
      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-vds-muted">Coverage: {coverageLabel[result.coverage.level]} · {result.evidence.length} document excerpt{result.evidence.length === 1 ? "" : "s"}</p>
          {result.structuredFacts?.price && result.coverage.satisfiedCategories.includes("price") && (
            <p className="rounded-xl border border-vds-border p-3 text-sm">
              Current approved price: {result.structuredFacts.price.offerPrice ?? result.structuredFacts.price.basePrice} {result.structuredFacts.price.currency} (effective {result.structuredFacts.price.effectiveFrom})
            </p>
          )}
          {result.evidence.map((item) => (
            <article key={item.citation} className="rounded-xl border border-vds-border p-4">
              <p className="break-words font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-vds-muted">{item.documentType.replace("_", " ")} · {item.citation} · {item.matchMode === "all_terms" ? "matches all terms" : "matches some terms"}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.snippet}</p>
              <p className="mt-2 flex flex-wrap gap-3 text-xs">
                {documentUrls[item.documentId] && <a className="focus-ring underline" href={documentUrls[item.documentId]} target="_blank" rel="noreferrer">View Document</a>}
                <Link className="focus-ring underline" href={`/vayon/properties/${propertyId}/documents/${item.documentId}`}>View Extracted Text</Link>
              </p>
            </article>
          ))}
          {result.evidence.length === 0 && <p className="text-sm text-vds-muted">No approved document text matched this search.</p>}
        </div>
      )}
    </section>
  );
}
