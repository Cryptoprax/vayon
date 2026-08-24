import type { CreativeCapability } from "@/features/vayon/creative-runtime/types";
export type CreativeStudioId =
  | "brand"
  | "campaign"
  | "image"
  | "video"
  | "document"
  | "presentation"
  | "website"
  | "social"
  | "email"
  | "advertising"
  | "templates"
  | "assets"
  | "runtime"
  | "pipelines"
  | "director";
export interface StudioContract {
  readonly id: CreativeStudioId;
  readonly name: string;
  readonly purpose: string;
  readonly route: string | null;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly supportedAssets: readonly string[];
  readonly pipelineDependencies: readonly string[];
  readonly brandDependencies: readonly string[];
  readonly approvalFlow: readonly ApprovalStage[];
  readonly permissionRequirements: readonly string[];
  readonly exportFormats: readonly string[];
  readonly providerRequirements: readonly CreativeCapability[];
  readonly implementation: "available" | "foundation" | "architecture";
}
export type ApprovalStage =
  | "Draft"
  | "Internal Review"
  | "Brand Review"
  | "Legal Review"
  | "Marketing Approval"
  | "Founder Approval"
  | "Published";
export interface AiDepartment {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly studioId: CreativeStudioId;
  readonly specialists: readonly string[];
  readonly execution: "orchestrated_only";
}
export type AssetKind =
  | "Brand"
  | "Campaign"
  | "Project"
  | "Document"
  | "Image"
  | "Video"
  | "Website"
  | "Presentation"
  | "Email"
  | "Advertisement"
  | "Social Post";
export interface AssetGraphNode {
  readonly id: string;
  readonly kind: AssetKind;
  readonly workspaceId: string;
  readonly externalId: string;
  readonly version: number;
}
export interface AssetGraphEdge {
  readonly from: string;
  readonly to: string;
  readonly relationship:
    | "belongs_to"
    | "uses_brand"
    | "generated_for"
    | "version_of"
    | "approved_by"
    | "references";
}
export interface UnifiedCreativePrompt {
  readonly businessGoal: string;
  readonly audience: readonly string[];
  readonly tone: string;
  readonly brandId: string;
  readonly campaignId: string | null;
  readonly language: string;
  readonly region: string;
  readonly industry: string;
  readonly style: string;
  readonly outputs: readonly string[];
  readonly constraints: readonly string[];
}
export interface CreativeMemoryContract {
  readonly sharedBrandMemory: readonly string[];
  readonly campaignMemory: readonly string[];
  readonly creativeMemory: readonly string[];
  readonly promptMemory: readonly string[];
  readonly approvalMemory: readonly string[];
  readonly assetRelationships: readonly AssetGraphEdge[];
  readonly versionRelationships: readonly AssetGraphEdge[];
  readonly persistence: "not_implemented";
}
export interface CreativeCostAttribution {
  readonly jobId: string;
  readonly estimatedCost: number | null;
  readonly providerCost: number | null;
  readonly tokenCost: number | null;
  readonly generationCost: number | null;
  readonly exportCost: number | null;
  readonly budgetAllocation: number | null;
  readonly currency: string | null;
  readonly billingIntegrated: false;
}
export interface CreativeCloudSnapshot {
  readonly studios: readonly StudioContract[];
  readonly departments: readonly AiDepartment[];
  readonly memory: CreativeMemoryContract;
  readonly assetGraph: {
    readonly nodes: readonly AssetGraphNode[];
    readonly edges: readonly AssetGraphEdge[];
  };
  readonly approvalLifecycle: readonly ApprovalStage[];
  readonly executionPath: readonly string[];
  readonly providerStrategy: readonly string[];
  readonly observability: {
    readonly creativeJobs: number;
    readonly pipelineHealth: "Ready";
    readonly departmentWorkload: "Unavailable";
    readonly approvalQueue: number;
    readonly providerReadiness: "Unavailable";
    readonly runtimeHealth: "Unavailable";
  };
  readonly roadmap: readonly {
    readonly phase: number;
    readonly title: string;
    readonly state: "future";
  }[];
  readonly generatedAt: string;
}
