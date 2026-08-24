export type PipelineType =
  | "Brochure"
  | "Company Profile"
  | "Product Catalogue"
  | "Pitch Deck"
  | "Proposal"
  | "Flyer"
  | "Poster"
  | "Roll-up Banner"
  | "Landing Page"
  | "Email Campaign"
  | "Social Campaign"
  | "Product Datasheet"
  | "Case Study"
  | "Whitepaper"
  | "Press Release";
export type PipelineNodeStatus =
  | "pending"
  | "waiting"
  | "blocked"
  | "running"
  | "completed"
  | "failed"
  | "waiting_approval"
  | "cancelled";
export type PipelineDepartment =
  | "Creative Director"
  | "Brand Designer"
  | "Graphic Designer"
  | "Copywriter"
  | "Presentation Designer"
  | "Document Designer"
  | "Layout Specialist"
  | "Illustration Specialist"
  | "Reviewer"
  | "Publisher";
export type PipelineStage =
  | "Campaign Planning"
  | "Brand Resolution"
  | "Content Planning"
  | "Copywriting"
  | "Creative Direction"
  | "Image Assignment"
  | "Layout Planning"
  | "Document Assembly"
  | "Internal Review"
  | "Brand Validation"
  | "Approval"
  | "Export";
export interface PipelineNode {
  readonly id: string;
  readonly stage: PipelineStage;
  readonly status: PipelineNodeStatus;
  readonly dependencies: readonly string[];
  readonly inputs: Readonly<Record<string, string | null>>;
  readonly outputs: Readonly<Record<string, string | null>>;
  readonly assignedDepartment: PipelineDepartment;
  readonly durationEstimateMinutes: number;
  readonly retryCount: number;
  readonly runtimeOnly: true;
}
export interface CreativePipeline {
  readonly id: string;
  readonly name: string;
  readonly type: PipelineType;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly campaignId: string | null;
  readonly brandId: string | null;
  readonly status:
    "draft" | "active" | "blocked" | "review" | "completed" | "archived";
  readonly nodes: readonly PipelineNode[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
export type CopyBlockType =
  | "Headline"
  | "Body copy"
  | "Product description"
  | "Call to action"
  | "Feature list"
  | "FAQ"
  | "Testimonial"
  | "Legal text";
export type LayoutFormat =
  | "A4"
  | "A5"
  | "Letter"
  | "Presentation"
  | "Square"
  | "Landscape"
  | "Portrait"
  | "Social";
export type DocumentBlockType =
  | "text"
  | "image"
  | "table"
  | "chart"
  | "icon"
  | "caption"
  | "footer"
  | "header";
export interface DocumentBlock {
  readonly id: string;
  readonly type: DocumentBlockType;
  readonly content: Readonly<Record<string, string | number | boolean | null>>;
  readonly brandReference: string | null;
  readonly order: number;
}
export interface DocumentSection {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly DocumentBlock[];
  readonly order: number;
}
export interface DocumentPage {
  readonly id: string;
  readonly format: LayoutFormat;
  readonly sections: readonly DocumentSection[];
  readonly pageNumber: number;
}
export interface CreativeDocument {
  readonly id: string;
  readonly title: string;
  readonly pages: readonly DocumentPage[];
  readonly brandId: string;
  readonly projectId: string;
  readonly version: number;
  readonly state: "planned";
  readonly generated: false;
}
export interface PipelineReview {
  readonly brandValidation: "pass" | "review";
  readonly completeness: "pass" | "review";
  readonly missingAssets: readonly string[];
  readonly brokenReferences: readonly string[];
  readonly typographyCheck: "pass" | "review";
  readonly colourCheck: "pass" | "review";
  readonly approvalRequirements: readonly string[];
  readonly automatedJudgement: false;
}
export interface PipelineSnapshot {
  readonly pipelines: readonly CreativePipeline[];
  readonly templates: readonly PipelineType[];
  readonly projects: readonly string[];
  readonly queue: {
    readonly queued: number;
    readonly running: number;
    readonly blocked: number;
  };
  readonly health: "Unavailable" | "Ready";
  readonly runtimeStatus: "Unavailable";
  readonly exports: readonly string[];
  readonly generatedAt: string;
}
