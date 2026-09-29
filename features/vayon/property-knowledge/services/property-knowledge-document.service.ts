import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { PropertyKnowledgeDocumentRepository } from "../repositories/property-knowledge-document.repository";
import { propertyKnowledgeDocumentTypes, type PropertyKnowledgeDocumentType } from "../domain/types";

/**
 * MIME -> allowed extension(s). Both are checked (Part 15 steps 4-5) because
 * a browser-reported MIME type is trivially spoofable on its own; requiring
 * the file's extension to agree with it closes the easiest MIME-spoofing
 * path without attempting real content sniffing, which K1 does not need
 * (K1 never parses document contents -- see Part 21).
 */
const allowedMimeExtensions: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "application/pdf": ["pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "text/plain": ["txt"],
  "text/markdown": ["md"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
});
const maxUploadBytes = 20 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  const base = name
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\.\./g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .trim();
  return (base || "document").slice(-150);
}

export interface UploadPropertyKnowledgeDocumentInput {
  readonly propertyId: string;
  readonly documentType: PropertyKnowledgeDocumentType;
  readonly title: string;
  readonly file: File;
}

export class PropertyKnowledgeDocumentService {
  constructor(
    private repository: PropertyKnowledgeDocumentRepository,
    private client: Awaited<ReturnType<typeof operationsContext>>["client"],
    private organizationId: string,
    private workspaceId: string,
  ) {}

  static async production() {
    const context = await operationsContext();
    return new PropertyKnowledgeDocumentService(
      new PropertyKnowledgeDocumentRepository(context.client, context.organizationId, context.workspaceId),
      context.client,
      context.organizationId,
      context.workspaceId,
    );
  }

  listForProperty(propertyId: string) {
    return this.repository.listForProperty(propertyId);
  }

  get(documentId: string) {
    return this.repository.get(documentId);
  }

  signedUrl(documentId: string) {
    return this.repository.get(documentId).then((document) => {
      if (!document) throw new Error("Document not found.");
      return this.repository.signedUrl(document.storagePath);
    });
  }

  approve(documentId: string) {
    return this.repository.approve(documentId);
  }

  archive(documentId: string) {
    return this.repository.archive(documentId);
  }

  supersede(oldDocumentId: string, newDocumentId: string) {
    return this.repository.supersede(oldDocumentId, newDocumentId);
  }

  /**
   * Sequence follows Part 15 exactly: property ownership -> MIME -> extension
   * -> size -> server-generated path -> upload -> register -> return. If
   * registration fails after the storage object exists, the object is
   * removed so K1 never leaves a silent orphan (Part 15's explicit cleanup
   * requirement; the pre-existing KnowledgeRepository.upload() precedent
   * this mirrors does not do this, but K1's own spec asks for it).
   */
  async upload(input: UploadPropertyKnowledgeDocumentInput): Promise<string> {
    if (!propertyKnowledgeDocumentTypes.includes(input.documentType)) {
      throw new Error("Unsupported document type.");
    }

    const { data: property, error: propertyError } = await this.client
      .from("properties")
      .select("id")
      .eq("id", input.propertyId)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", this.workspaceId)
      .is("deleted_at", null)
      .maybeSingle();
    if (propertyError) throw propertyError;
    if (!property) throw new Error("Property not found in the active workspace.");

    const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowedExtensions = allowedMimeExtensions[input.file.type];
    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
      throw new Error("Unsupported file type. Upload a PDF, DOCX, TXT, Markdown, PNG, or JPEG file.");
    }

    if (input.file.size <= 0 || input.file.size > maxUploadBytes) {
      throw new Error("File must be larger than 0 bytes and no larger than 20 MB.");
    }

    const title = input.title.trim().slice(0, 200) || sanitizeFilename(input.file.name);
    const storagePath = `${this.organizationId}/${this.workspaceId}/property-knowledge/${input.propertyId}/${crypto.randomUUID()}-${sanitizeFilename(input.file.name)}`;

    await this.repository.uploadObject(storagePath, input.file);
    try {
      return await this.repository.register({
        propertyId: input.propertyId,
        documentType: input.documentType,
        title,
        originalFilename: input.file.name.slice(0, 255),
        storagePath,
        mimeType: input.file.type,
        byteSize: input.file.size,
      });
    } catch (error) {
      await this.repository.removeObject(storagePath).catch(() => undefined);
      throw error;
    }
  }
}
