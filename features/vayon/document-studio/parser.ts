import { createEditableDocument } from "./model";
import type { DocumentType, EditableDocumentModel } from "./types";
export function parseGeneratedDocument(input: {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  workspaceId: string;
  projectId: string | null;
  campaignId: string | null;
  brandId: string | null;
}): EditableDocumentModel {
  const chunks = input.content
      .split(/\n(?=#{1,3}\s)/)
      .map((value) => value.trim())
      .filter(Boolean),
    sections = chunks.map((chunk, index) => {
      const lines = chunk.split("\n"),
        heading =
          lines[0]?.replace(/^#{1,3}\s*/, "").trim() || `Section ${index + 1}`,
        body = lines.slice(1).join("\n").trim();
      return {
        id: `${input.id}-section-${index + 1}`,
        title: heading,
        order: index,
        blocks: body
          ? [
              {
                id: `${input.id}-block-${index + 1}`,
                kind: "paragraph" as const,
                content: body,
                order: 0,
              },
            ]
          : [],
      };
    });
  return createEditableDocument({
    ...input,
    sections: sections.length
      ? sections
      : [
          {
            id: `${input.id}-section-1`,
            title: input.title,
            order: 0,
            blocks: [
              {
                id: `${input.id}-block-1`,
                kind: "paragraph",
                content: input.content,
                order: 0,
              },
            ],
          },
        ],
  });
}
