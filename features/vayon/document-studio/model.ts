import type { DocumentType, EditableDocumentModel } from "./types";
export function createEditableDocument(input: {
  id: string;
  title: string;
  type: DocumentType;
  workspaceId: string;
  projectId: string | null;
  campaignId: string | null;
  brandId: string | null;
  sections: EditableDocumentModel["sections"];
}): EditableDocumentModel {
  return {
    ...input,
    version: 1,
    comments: [],
    approval: "draft",
    updatedAt: new Date().toISOString(),
  };
}
export function reviseDocument(
  document: EditableDocumentModel,
  sections: EditableDocumentModel["sections"],
): EditableDocumentModel {
  return {
    ...document,
    sections,
    version: document.version + 1,
    updatedAt: new Date().toISOString(),
  };
}
