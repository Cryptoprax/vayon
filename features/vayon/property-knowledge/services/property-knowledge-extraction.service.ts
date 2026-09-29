import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { log } from "@/lib/observability/logger";
import { PropertyKnowledgeDocumentRepository } from "../repositories/property-knowledge-document.repository";
import { ExtractionError, extractDocumentText } from "../extraction/extractors";
import { extractionStaleAfterSeconds, type PropertyKnowledgeExtractionErrorCode } from "../domain/types";

export type ExtractionOutcome =
  | { outcome: "completed" }
  | { outcome: "failed"; errorCode: PropertyKnowledgeExtractionErrorCode }
  | { outcome: "already_processing" | "already_completed" | "not_supported" | "not_found" };

/**
 * Extraction accepts ONLY a document id. The storage path, MIME type,
 * property, workspace and organization are all derived from the tenant-scoped
 * K1 row, never from the caller. Extracted text is untrusted source content:
 * this service stores it inert and never interprets it, calls an AI provider,
 * builds a prompt, or mutates any CRM/property/price field.
 */
export class PropertyKnowledgeExtractionService {
  constructor(private repository: PropertyKnowledgeDocumentRepository) {}

  static async production() {
    const context = await operationsContext();
    return new PropertyKnowledgeExtractionService(
      new PropertyKnowledgeDocumentRepository(context.client, context.organizationId, context.workspaceId),
    );
  }

  async extract(documentId: string): Promise<ExtractionOutcome> {
    const document = await this.repository.get(documentId);
    if (!document) return { outcome: "not_found" };

    const claim = await this.repository.claimExtraction(documentId, extractionStaleAfterSeconds);
    if (claim !== "claimed") return { outcome: claim as "already_processing" | "already_completed" | "not_supported" };

    try {
      const bytes = await this.download(document.storagePath, document.propertyId);
      const text = await extractDocumentText(document.mimeType, bytes);
      await this.repository.completeExtraction(documentId, text);
      return { outcome: "completed" };
    } catch (error) {
      const errorCode: PropertyKnowledgeExtractionErrorCode = error instanceof ExtractionError ? error.code : "EXTRACTION_FAILED";
      log("property_knowledge.extraction_failed", { documentId, errorCode });
      await this.repository.failExtraction(documentId, errorCode);
      return { outcome: "failed", errorCode };
    }
  }

  private async download(storagePath: string, propertyId: string): Promise<Uint8Array> {
    try {
      return await this.repository.downloadObject(storagePath, propertyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      throw new ExtractionError(/not found|404/i.test(message) ? "SOURCE_NOT_FOUND" : "DOWNLOAD_FAILED");
    }
  }

  async getExtractedText(documentId: string) {
    return this.repository.getExtractedText(documentId);
  }
}
