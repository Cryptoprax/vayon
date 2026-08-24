import type {
  CreativePipeline,
  PipelineDepartment,
  PipelineStage,
  PipelineType,
} from "./types";
const stages: readonly {
  stage: PipelineStage;
  department: PipelineDepartment;
  minutes: number;
}[] = [
  { stage: "Campaign Planning", department: "Creative Director", minutes: 30 },
  { stage: "Brand Resolution", department: "Brand Designer", minutes: 15 },
  { stage: "Content Planning", department: "Creative Director", minutes: 30 },
  { stage: "Copywriting", department: "Copywriter", minutes: 90 },
  { stage: "Creative Direction", department: "Creative Director", minutes: 30 },
  {
    stage: "Image Assignment",
    department: "Illustration Specialist",
    minutes: 30,
  },
  { stage: "Layout Planning", department: "Layout Specialist", minutes: 45 },
  { stage: "Document Assembly", department: "Document Designer", minutes: 120 },
  { stage: "Internal Review", department: "Reviewer", minutes: 45 },
  { stage: "Brand Validation", department: "Brand Designer", minutes: 30 },
  { stage: "Approval", department: "Reviewer", minutes: 60 },
  { stage: "Export", department: "Publisher", minutes: 30 },
];
export function planCreativePipeline(input: {
  id: string;
  name: string;
  type: PipelineType;
  workspaceId: string;
  projectId: string;
  campaignId: string | null;
  brandId: string | null;
}): CreativePipeline {
  const now = new Date().toISOString();
  return {
    ...input,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    nodes: stages.map((item, index) => ({
      id: `${input.id}-node-${index + 1}`,
      stage: item.stage,
      status: index ? "waiting" : "pending",
      dependencies: index ? [`${input.id}-node-${index}`] : [],
      inputs: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        campaignId: input.campaignId,
        brandId: input.brandId,
      },
      outputs: { artifact: null },
      assignedDepartment: item.department,
      durationEstimateMinutes: item.minutes,
      retryCount: 0,
      runtimeOnly: true,
    })),
  };
}
export function pipelineExecutionOrder(pipeline: CreativePipeline) {
  const resolved: string[] = [],
    remaining = [...pipeline.nodes];
  while (remaining.length) {
    const index = remaining.findIndex((node) =>
      node.dependencies.every((dependency) => resolved.includes(dependency)),
    );
    if (index < 0)
      return {
        ordered: resolved,
        blocked: remaining.map((node) => node.id),
        valid: false,
      };
    const [node] = remaining.splice(index, 1);
    resolved.push(node!.id);
  }
  return { ordered: resolved, blocked: [], valid: true };
}
