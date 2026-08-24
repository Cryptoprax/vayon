import type { ExecutionResult } from "@/features/vayon/creative-execution/types";

export const documentTypes = [
  "Company Profile",
  "Corporate Brochure",
  "Product Brochure",
  "Product Catalogue",
  "Proposal",
  "Quotation",
  "Pitch Deck",
  "Sales Presentation",
  "Flyer",
  "Poster",
  "Product Datasheet",
  "Whitepaper",
  "Press Release",
] as const;
export type DocumentType = (typeof documentTypes)[number];
export type DocumentBlockKind =
  | "heading"
  | "paragraph"
  | "image"
  | "table"
  | "chart"
  | "icon"
  | "callout"
  | "qr-code";
export interface EditableDocumentBlock {
  readonly id: string;
  readonly kind: DocumentBlockKind;
  readonly content: string;
  readonly order: number;
}
export interface EditableDocumentSection {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly EditableDocumentBlock[];
  readonly order: number;
}
export interface EditableDocumentModel {
  readonly id: string;
  readonly title: string;
  readonly type: DocumentType;
  readonly workspaceId: string;
  readonly projectId: string | null;
  readonly campaignId: string | null;
  readonly brandId: string | null;
  readonly sections: readonly EditableDocumentSection[];
  readonly version: number;
  readonly comments: readonly DocumentComment[];
  readonly approval: "draft" | "review" | "approved";
  readonly updatedAt: string;
}
export interface DocumentComment {
  readonly id: string;
  readonly blockId: string | null;
  readonly message: string;
  readonly authorId: string;
  readonly createdAt: string;
}
export interface DocumentWizardInput {
  readonly prompt: string;
  readonly company: string;
  readonly industry: string;
  readonly audience: string;
  readonly language: string;
  readonly brandId: string | null;
  readonly campaignId: string | null;
  readonly projectId: string | null;
  readonly purpose: string;
  readonly tone: string;
  readonly length: "Short" | "Standard" | "Detailed";
  readonly documentType: DocumentType;
}
export interface DocumentStudioSnapshot {
  readonly brands: readonly { id: string; name: string }[];
  readonly campaigns: readonly { id: string; name: string }[];
  readonly projects: readonly { id: string; name: string }[];
  readonly documents: readonly EditableDocumentModel[];
  readonly executionStatus: "WaitingProvider" | "Ready";
  readonly exports: readonly [
    "PDF",
    "DOCX",
    "PPTX",
    "HTML",
    "Editable Project",
  ];
  readonly aiEdits: readonly string[];
  readonly pipeline: readonly string[];
}
export interface DocumentSubmission {
  readonly result: ExecutionResult;
  readonly document: EditableDocumentModel | null;
  readonly review: import("./quality-review").DocumentQualityReview | null;
}
