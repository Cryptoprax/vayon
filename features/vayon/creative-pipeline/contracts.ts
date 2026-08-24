import type {
  CopyBlockType,
  CreativeDocument,
  LayoutFormat,
  PipelineReview,
} from "./types";
export interface CopywriterRequest {
  readonly pipelineId: string;
  readonly blockTypes: readonly CopyBlockType[];
  readonly language: string;
  readonly brandId: string;
  readonly sourceReferences: readonly string[];
}
export interface CopywriterResult {
  readonly state: "planned";
  readonly blocks: readonly {
    readonly type: CopyBlockType;
    readonly content: string | null;
  }[];
  readonly providerUsed: null;
}
export interface LayoutRequest {
  readonly pipelineId: string;
  readonly format: LayoutFormat;
  readonly document: CreativeDocument;
  readonly brandId: string;
}
export interface LayoutResult {
  readonly state: "planned";
  readonly pageCount: number;
  readonly providerUsed: null;
}
export interface PipelineReviewContract {
  review(document: CreativeDocument): PipelineReview;
}
export interface PipelineExportContract {
  readonly formats: readonly (
    "PDF" | "PPTX" | "DOCX" | "HTML" | "INDD" | "Editable Project"
  )[];
  prepare(
    document: CreativeDocument,
  ): Readonly<{ state: "unavailable"; generated: false }>;
}
