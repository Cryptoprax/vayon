export type OrchestratorStepStatus =
  | "completed"
  | "current"
  | "waiting-for-approval"
  | "blocked"
  | "upcoming";

export interface OrchestratorStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly modules: readonly string[];
  readonly dependencies: readonly string[];
  readonly status: OrchestratorStepStatus;
  readonly estimatedMinutes: number;
  readonly approvalRequired: true;
  readonly executable: false;
}

export interface OrchestratorTemplate {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly expectedOutputs: readonly string[];
  readonly missingRequirements: readonly string[];
  readonly warnings: readonly string[];
  readonly steps: readonly OrchestratorStep[];
}

export interface LocalWorkflowHistory {
  readonly id: string;
  readonly template: string;
  readonly status: "cancelled" | "approval-confirmed";
  readonly timestamp: string;
  readonly duration: string;
}
