import Link from "next/link";
import { Button } from "@/features/platform/design-system";
import type { PropertyKnowledgeDocument } from "@/features/vayon/property-knowledge/domain/types";
import type { AuthoritativePropertyFacts, PriceRevision } from "../domain/types";
import {
  approvePriceRevisionAction,
  archivePriceRevisionAction,
  createPriceRevisionAction,
} from "../actions/property-price-revision.actions";

const card = "rounded-2xl border border-vds-border bg-vds-surface p-5";
const sourceTypes = ["price_sheet", "payment_plan", "brochure"];

function amount(currency: string, value: string | null) {
  if (value === null) return null;
  const [whole, fraction = ""] = value.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")} ${currency}`;
}

function revisionLabel(revision: PriceRevision, currentId: string | null) {
  if (revision.id === currentId) return "Approved - current";
  if (revision.status === "draft") return "Draft - not current";
  if (revision.status === "archived") return "Archived";
  if (revision.supersededBy) return "Approved - superseded";
  return "Approved - not yet effective or expired";
}

/**
 * Phase K3: authoritative structured price. Only the current APPROVED
 * revision is shown as the price; drafts are labelled not current. Values are
 * entered by a person -- nothing is read, parsed or suggested from document
 * text. Extracted PDF text is never presented as a price.
 */
export function PropertyPricingFacts({
  propertyId,
  facts,
  revisions,
  documents,
  canManage,
  error,
}: {
  propertyId: string;
  facts: AuthoritativePropertyFacts;
  revisions: readonly PriceRevision[];
  documents: readonly PropertyKnowledgeDocument[];
  canManage: boolean;
  error?: string;
}) {
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const price = facts.price;
  const source = price?.sourceDocumentId ? documentById.get(price.sourceDocumentId) : undefined;
  const eligibleSources = documents.filter((document) => sourceTypes.includes(document.documentType) && document.status !== "archived");

  return (
    <div className="space-y-5">
      {error && <p role="alert" className="rounded-xl border border-vds-danger bg-vds-danger-soft p-3 text-sm text-vds-danger">{error}</p>}

      <section className={card} aria-labelledby="property-price-heading">
        <h2 id="property-price-heading" className="font-semibold">Current price</h2>
        {price ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs text-vds-muted">Price</dt><dd className="mt-1 text-lg font-medium">{amount(price.currency, price.offerPrice ?? price.basePrice)}</dd></div>
            {price.offerPrice && price.basePrice && <div><dt className="text-xs text-vds-muted">Base price</dt><dd className="mt-1 text-sm">{amount(price.currency, price.basePrice)}</dd></div>}
            <div><dt className="text-xs text-vds-muted">Effective from</dt><dd className="mt-1 text-sm">{price.effectiveFrom}</dd></div>
            <div><dt className="text-xs text-vds-muted">Status</dt><dd className="mt-1 text-sm">Approved</dd></div>
            <div className="min-w-0">
              <dt className="text-xs text-vds-muted">Source</dt>
              <dd className="mt-1 break-words text-sm">
                {source ? source.title : price.sourceDocumentId ? "Source document" : "Manual entry"}
                {source?.extractionStatus === "completed" && (
                  <> · <Link className="focus-ring underline" href={`/vayon/properties/${propertyId}/documents/${source.id}`}>View source document text</Link></>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-vds-muted">No approved price is in effect for this property. Add a price revision and approve it to set one.</p>
        )}
        {facts.unverifiedListingPrice && (
          <p className="mt-4 text-xs text-vds-muted">
            Listing price on the property record (unverified, not the approved price): {amount(facts.unverifiedListingPrice.currency, facts.unverifiedListingPrice.amount)}
          </p>
        )}
      </section>

      {canManage && (
        <section className={card} aria-labelledby="price-revision-form">
          <h2 id="price-revision-form" className="font-semibold">Add price revision</h2>
          <p className="mt-2 text-sm text-vds-muted">
            Enter the price yourself. Nothing is filled in from documents, and a new revision is a draft until you approve it.
          </p>
          <form action={createPriceRevisionAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="propertyId" value={propertyId} />
            <label className="text-sm"><span className="mb-1 block text-xs text-vds-muted">Currency (3-letter code)</span>
              <input name="currency" required maxLength={3} defaultValue={facts.unverifiedListingPrice?.currency ?? ""} className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm uppercase" /></label>
            <label className="text-sm"><span className="mb-1 block text-xs text-vds-muted">Effective from</span>
              <input type="date" name="effectiveFrom" required className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm" /></label>
            <label className="text-sm"><span className="mb-1 block text-xs text-vds-muted">Base price</span>
              <input name="basePrice" inputMode="decimal" placeholder="e.g. 18500000.00" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm" /></label>
            <label className="text-sm"><span className="mb-1 block text-xs text-vds-muted">Offer price (optional)</span>
              <input name="offerPrice" inputMode="decimal" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm" /></label>
            <label className="text-sm sm:col-span-2"><span className="mb-1 block text-xs text-vds-muted">Source document (optional; must be approved before the revision can be approved)</span>
              <select name="sourceDocumentId" defaultValue="" className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm">
                <option value="">None - manual entry</option>
                {eligibleSources.map((document) => <option key={document.id} value={document.id}>{document.title} ({document.documentType.replace("_", " ")}, {document.status})</option>)}
              </select></label>
            <label className="text-sm sm:col-span-2"><span className="mb-1 block text-xs text-vds-muted">Notes (optional)</span>
              <textarea name="notes" maxLength={1000} rows={2} className="w-full rounded-lg border border-vds-border bg-vds-background p-2 text-sm" /></label>
            <div className="sm:col-span-2"><Button type="submit" variant="primary">Save draft revision</Button></div>
          </form>
          {eligibleSources.some((document) => document.extractionStatus === "completed") && (
            <p className="mt-3 text-xs text-vds-muted">
              To check a figure against a document, open its extracted text:{" "}
              {eligibleSources.filter((document) => document.extractionStatus === "completed").map((document) => (
                <Link key={document.id} className="focus-ring mr-2 underline" href={`/vayon/properties/${propertyId}/documents/${document.id}`}>{document.title}</Link>
              ))}
            </p>
          )}
        </section>
      )}

      <section className={card} aria-labelledby="price-history-heading">
        <h2 id="price-history-heading" className="font-semibold">Price revisions</h2>
        <div className="mt-4 space-y-3">
          {revisions.length ? revisions.map((revision) => {
            const revisionSource = revision.sourceDocumentId ? documentById.get(revision.sourceDocumentId) : undefined;
            return (
              <article key={revision.id} className="rounded-xl border border-vds-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">v{revision.version} · {amount(revision.currency, revision.offerPrice ?? revision.basePrice)}{revision.offerPrice && revision.basePrice ? ` (base ${amount(revision.currency, revision.basePrice)})` : ""}</p>
                    <p className="mt-1 text-xs text-vds-muted">
                      {revisionLabel(revision, price?.revisionId ?? null)} · effective {revision.effectiveFrom} · source: {revisionSource ? revisionSource.title : revision.sourceDocumentId ? "source document" : "manual entry"}
                    </p>
                    {revision.notes && <p className="mt-1 break-words text-xs text-vds-muted">{revision.notes}</p>}
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      {revision.status === "draft" && (
                        <form action={approvePriceRevisionAction}>
                          <input type="hidden" name="propertyId" value={propertyId} />
                          <input type="hidden" name="revisionId" value={revision.id} />
                          <Button type="submit" variant="ghost">Approve</Button>
                        </form>
                      )}
                      {revision.status !== "archived" && (
                        <form action={archivePriceRevisionAction}>
                          <input type="hidden" name="propertyId" value={propertyId} />
                          <input type="hidden" name="revisionId" value={revision.id} />
                          <Button type="submit" variant="ghost" className="text-vds-danger">Archive</Button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          }) : <p className="text-sm text-vds-muted">No price revisions have been added yet.</p>}
        </div>
      </section>

      <section className={card} aria-labelledby="property-facts-heading">
        <h2 id="property-facts-heading" className="font-semibold">Property facts on record</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Type", `${facts.propertyType} (${facts.listingType})`],
            ["Status", facts.status.replaceAll("_", " ")],
            ["Location", [facts.location.locality, facts.location.city, facts.location.region, facts.location.countryCode].filter(Boolean).join(", ")],
            ["Bedrooms", facts.bedrooms === null ? "Not recorded" : String(facts.bedrooms)],
            ["Bathrooms", facts.bathrooms === null ? "Not recorded" : String(facts.bathrooms)],
            ["Area", facts.area === null ? "Not recorded" : `${facts.area} ${facts.areaUnit}`],
            ["Amenities", facts.amenities.length ? facts.amenities.join(", ") : "Not recorded"],
          ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-vds-muted">{label}</dt><dd className="mt-1 break-words text-sm">{value}</dd></div>)}
        </dl>
      </section>
    </div>
  );
}
