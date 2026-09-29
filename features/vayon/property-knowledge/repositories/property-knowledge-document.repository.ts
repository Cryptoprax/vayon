import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractionStaleAfterSeconds, type PropertyKnowledgeDocument, type PropertyKnowledgeDocumentType } from "../domain/types";

const documentColumns =
  "id,property_id,document_type,title,original_filename,storage_path,mime_type,byte_size,status,version,superseded_by,uploaded_by,uploaded_at,approved_by,approved_at,extraction_status,extraction_error_code,extraction_started_at,extracted_at,extracted_character_count";

function toDocument(row: Record<string, unknown>): PropertyKnowledgeDocument {
  const startedAtMs = row.extraction_started_at ? new Date(String(row.extraction_started_at)).getTime() : 0;
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    documentType: row.document_type as PropertyKnowledgeDocumentType,
    title: String(row.title),
    originalFilename: String(row.original_filename),
    storagePath: String(row.storage_path),
    mimeType: String(row.mime_type),
    byteSize: Number(row.byte_size),
    status: row.status as PropertyKnowledgeDocument["status"],
    version: Number(row.version),
    supersededBy: row.superseded_by ? String(row.superseded_by) : null,
    uploadedBy: String(row.uploaded_by),
    uploadedAt: String(row.uploaded_at),
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    extractionStatus: row.extraction_status as PropertyKnowledgeDocument["extractionStatus"],
    extractionErrorCode: (row.extraction_error_code as PropertyKnowledgeDocument["extractionErrorCode"]) ?? null,
    extractionStartedAt: row.extraction_started_at ? String(row.extraction_started_at) : null,
    extractedAt: row.extracted_at ? String(row.extracted_at) : null,
    extractedCharacterCount: row.extracted_character_count === null || row.extracted_character_count === undefined ? null : Number(row.extracted_character_count),
    extractionStale: row.extraction_status === "processing" && Date.now() - startedAtMs > extractionStaleAfterSeconds * 1000,
  };
}

/**
 * Every read is explicitly scoped to organization_id + workspace_id (plus
 * property_id/document_id as applicable) even though RLS already enforces
 * tenant isolation as a structural backstop -- defense in depth, matching
 * every repository in this codebase since D1.
 */
export class PropertyKnowledgeDocumentRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}

  async listForProperty(propertyId: string): Promise<readonly PropertyKnowledgeDocument[]> {
    const { data, error } = await this.client
      .from("property_knowledge_documents")
      .select(documentColumns)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .eq("property_id", propertyId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toDocument);
  }

  async get(documentId: string): Promise<PropertyKnowledgeDocument | null> {
    const { data, error } = await this.client
      .from("property_knowledge_documents")
      .select(documentColumns)
      .eq("id", documentId)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    return data ? toDocument(data) : null;
  }

  async register(input: {
    propertyId: string;
    documentType: PropertyKnowledgeDocumentType;
    title: string;
    originalFilename: string;
    storagePath: string;
    mimeType: string;
    byteSize: number;
  }): Promise<string> {
    const { data, error } = await this.client.rpc("register_property_knowledge_document", {
      p_workspace_id: this.workspaceId,
      p_property_id: input.propertyId,
      p_document_type: input.documentType,
      p_title: input.title,
      p_original_filename: input.originalFilename,
      p_storage_path: input.storagePath,
      p_mime_type: input.mimeType,
      p_byte_size: input.byteSize,
    });
    if (error) throw error;
    return String(data);
  }

  async approve(documentId: string): Promise<void> {
    const { error } = await this.client.rpc("approve_property_knowledge_document", {
      p_workspace_id: this.workspaceId,
      p_document_id: documentId,
    });
    if (error) throw error;
  }

  async archive(documentId: string): Promise<void> {
    const { error } = await this.client.rpc("archive_property_knowledge_document", {
      p_workspace_id: this.workspaceId,
      p_document_id: documentId,
    });
    if (error) throw error;
  }

  async supersede(oldDocumentId: string, newDocumentId: string): Promise<void> {
    const { error } = await this.client.rpc("supersede_property_knowledge_document", {
      p_workspace_id: this.workspaceId,
      p_old_document_id: oldDocumentId,
      p_new_document_id: newDocumentId,
    });
    if (error) throw error;
  }

  /**
   * Refuses to sign a path outside this repository's own tenant prefix even
   * though RLS would also reject the underlying storage read -- this keeps
   * the guarantee visible at the application layer, not just the database.
   */
  async signedUrl(storagePath: string, expiresInSeconds = 900): Promise<string> {
    const tenantPrefix = `${this.organizationId}/${this.workspaceId}/`;
    if (!storagePath.startsWith(tenantPrefix)) {
      throw new Error("Document does not belong to the active workspace.");
    }
    const { data, error } = await this.client.storage
      .from("property-knowledge-documents")
      .createSignedUrl(storagePath, Math.min(Math.max(expiresInSeconds, 60), 3600));
    if (error) throw error;
    return data.signedUrl;
  }

  async uploadObject(storagePath: string, file: File): Promise<void> {
    const { error } = await this.client.storage
      .from("property-knowledge-documents")
      .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
  }

  async removeObject(storagePath: string): Promise<void> {
    await this.client.storage.from("property-knowledge-documents").remove([storagePath]);
  }

  // ---- Phase K2: extraction (writes only via controlled RPCs) ----

  async claimExtraction(documentId: string, staleAfterSeconds: number): Promise<string> {
    const { data, error } = await this.client.rpc("claim_property_knowledge_extraction", {
      p_workspace_id: this.workspaceId,
      p_document_id: documentId,
      p_stale_after_seconds: staleAfterSeconds,
    });
    if (error) throw error;
    return String(data);
  }

  async completeExtraction(documentId: string, text: string): Promise<void> {
    const { error } = await this.client.rpc("complete_property_knowledge_extraction", {
      p_workspace_id: this.workspaceId,
      p_document_id: documentId,
      p_text: text,
    });
    if (error) throw error;
  }

  async failExtraction(documentId: string, errorCode: string): Promise<void> {
    const { error } = await this.client.rpc("fail_property_knowledge_extraction", {
      p_workspace_id: this.workspaceId,
      p_document_id: documentId,
      p_error_code: errorCode,
    });
    if (error) throw error;
  }

  /**
   * Reads the source only from the document row's own storage path, and only
   * after confirming it sits under this tenant's own property prefix in the
   * property-knowledge-documents bucket. Never a public URL.
   */
  async downloadObject(storagePath: string, propertyId: string): Promise<Uint8Array> {
    const prefix = `${this.organizationId}/${this.workspaceId}/property-knowledge/${propertyId}/`;
    if (!storagePath.startsWith(prefix) || storagePath.includes("..")) {
      throw new Error("Document does not belong to the active workspace.");
    }
    const { data, error } = await this.client.storage.from("property-knowledge-documents").download(storagePath);
    if (error || !data) throw error ?? new Error("Download returned no data.");
    return new Uint8Array(await data.arrayBuffer());
  }

  async getExtractedText(documentId: string): Promise<{ propertyId: string; title: string; text: string; characterCount: number } | null> {
    const { data, error } = await this.client
      .from("property_knowledge_documents")
      .select("property_id,title,extracted_text,extracted_character_count,extraction_status")
      .eq("id", documentId)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.extraction_status !== "completed" || typeof data.extracted_text !== "string") return null;
    return { propertyId: String(data.property_id), title: String(data.title), text: data.extracted_text, characterCount: Number(data.extracted_character_count ?? data.extracted_text.length) };
  }
}
