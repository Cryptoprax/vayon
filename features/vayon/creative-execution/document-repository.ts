export type DocumentState = "Draft" | "Archived";
export interface EditableDocumentRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly campaignId: string | null;
  readonly brandId: string;
  readonly title: string;
  readonly state: DocumentState;
  readonly version: number;
  readonly content: Readonly<Record<string, unknown>>;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface DocumentSearch {
  readonly workspaceId: string;
  readonly query: string;
  readonly state: DocumentState | "All";
  readonly limit: number;
  readonly cursor: string | null;
}
export interface TenantSafeDocumentRepository {
  draft(
    input: Omit<
      EditableDocumentRecord,
      "id" | "version" | "createdAt" | "updatedAt"
    >,
  ): Promise<EditableDocumentRecord>;
  save(document: EditableDocumentRecord): Promise<EditableDocumentRecord>;
  load(
    workspaceId: string,
    documentId: string,
  ): Promise<EditableDocumentRecord | null>;
  version(
    workspaceId: string,
    documentId: string,
  ): Promise<EditableDocumentRecord>;
  archive(workspaceId: string, documentId: string): Promise<void>;
  restore(workspaceId: string, documentId: string): Promise<void>;
  delete(workspaceId: string, documentId: string): Promise<void>;
  search(input: DocumentSearch): Promise<readonly EditableDocumentRecord[]>;
}
