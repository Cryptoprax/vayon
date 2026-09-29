/**
 * Phase K1: property-scoped knowledge document foundation. No content/body/
 * embedding field exists here -- K1 stores and trust-gates documents only.
 * K2 owns text extraction; K4 owns retrieval; K5/K6 own the AI evidence
 * bridge. See supabase/migrations/20261110000000_property_knowledge_documents.sql
 * for the full schema/security rationale.
 */
export const propertyKnowledgeDocumentTypes = [
  "brochure", "price_sheet", "floor_plan", "master_plan", "amenities",
  "location", "faq", "specification", "payment_plan", "legal", "other",
] as const;
export type PropertyKnowledgeDocumentType = (typeof propertyKnowledgeDocumentTypes)[number];

export const propertyKnowledgeDocumentStatuses = ["uploaded", "review", "approved", "archived"] as const;
export type PropertyKnowledgeDocumentStatus = (typeof propertyKnowledgeDocumentStatuses)[number];

export interface PropertyKnowledgeDocument {
  readonly id: string;
  readonly propertyId: string;
  readonly documentType: PropertyKnowledgeDocumentType;
  readonly title: string;
  readonly originalFilename: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly status: PropertyKnowledgeDocumentStatus;
  readonly version: number;
  readonly supersededBy: string | null;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly extractionStatus: PropertyKnowledgeExtractionStatus;
  readonly extractionErrorCode: PropertyKnowledgeExtractionErrorCode | null;
  readonly extractionStartedAt: string | null;
  readonly extractedAt: string | null;
  readonly extractedCharacterCount: number | null;
  readonly extractionStale: boolean;
}

/**
 * Phase K2: extraction state. Extraction is independent of approval status:
 * completing extraction never approves a document, and an approved document
 * may have a failed extraction. Extracted text is untrusted source content.
 */
export const propertyKnowledgeExtractionStatuses = ["pending", "processing", "completed", "failed", "not_supported"] as const;
export type PropertyKnowledgeExtractionStatus = (typeof propertyKnowledgeExtractionStatuses)[number];

export const propertyKnowledgeExtractionErrorCodes = [
  "UNSUPPORTED_TYPE", "SOURCE_NOT_FOUND", "CORRUPT_DOCUMENT", "PASSWORD_PROTECTED",
  "NO_EXTRACTABLE_TEXT", "EXTRACTED_TEXT_TOO_LARGE", "DOWNLOAD_FAILED", "EXTRACTION_FAILED",
] as const;
export type PropertyKnowledgeExtractionErrorCode = (typeof propertyKnowledgeExtractionErrorCodes)[number];

export const maxExtractedTextCharacters = 500_000;
export const minExtractedTextCharacters = 10;
export const extractionStaleAfterSeconds = 600;
