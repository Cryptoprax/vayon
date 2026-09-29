/**
 * Deterministic citation identifiers, keyed by row id (never filename) so a
 * later AI message can trace back to the exact source. Same convention as the
 * existing knowledge citations (`slug@vN`).
 */
export const propertyDocumentCitation = (documentId: string, version: number) => `property-doc:${documentId}@v${version}`;
export const priceRevisionCitation = (revisionId: string) => `price-revision:${revisionId}`;
export const propertyCitation = (propertyId: string) => `property:${propertyId}`;
