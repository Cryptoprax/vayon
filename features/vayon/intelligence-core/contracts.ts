export type IntelligenceTab = "assistant" | "help" | "tasks" | "feedback";
export type IntelligenceActionKind =
  | "open_page"
  | "navigate"
  | "search"
  | "create_draft"
  | "explain_feature"
  | "show_documentation"
  | "future_ai_action";
export interface IntelligenceAction {
  readonly kind: IntelligenceActionKind;
  readonly label: string;
  readonly href?: string;
  readonly recommendationOnly: true;
  readonly executes: false;
}
// Compatibility invariant: recommendationOnly:true and executes:false.
export interface IntelligenceModule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly routePrefixes: readonly string[];
  readonly capabilities: readonly string[];
  readonly helpResources: readonly { label: string; href: string }[];
  readonly suggestedPrompts: readonly string[];
  readonly actions: readonly IntelligenceAction[];
  readonly futureTools: readonly string[];
}
export interface PageIntelligenceContext {
  readonly route: string;
  readonly moduleId: string;
  readonly moduleName: string;
  readonly page: string;
  readonly organization: string;
  readonly workspace: string;
  readonly user: string;
  readonly role: string;
  readonly subscriptionPlan: string;
  readonly feature: string;
  readonly selectedRecord: string | null;
  readonly workflow: string | null;
}
export type SuccessSignalKind =
  | "first_visit"
  | "empty_state"
  | "long_inactivity"
  | "repeated_failure"
  | "validation_error"
  | "permission_issue"
  | "configuration_issue"
  | "incomplete_onboarding"
  | "slow_workflow";
export interface IntelligenceIntegration {
  readonly id: string;
  readonly state: "connected" | "disconnected" | "unavailable";
}
export interface ContextGraph extends PageIntelligenceContext {
  readonly availableActions: readonly IntelligenceAction[];
  readonly permissions: readonly string[];
  readonly integrations: readonly IntelligenceIntegration[];
  readonly featureAvailable: boolean;
  readonly generatedAt: string;
}
export interface SuccessSignal {
  readonly kind: SuccessSignalKind;
  readonly title: string;
  readonly explanation: string;
  readonly nextStep: string;
  readonly retryable: boolean;
  readonly prompt: string;
  readonly helpHref: string;
  readonly videoHref: string | null;
}
export interface SuccessSnapshot {
  readonly firstVisit: boolean;
  readonly emptyState: boolean;
  readonly inactiveMs: number;
  readonly failureCount: number;
  readonly validationError: string | null;
  readonly permissionDenied: boolean;
  readonly configurationIssue: boolean;
  readonly onboardingComplete: boolean;
  readonly workflowLatencyMs: number | null;
}
export type OnboardingMilestone =
  | "first_project"
  | "first_inventory"
  | "first_lead"
  | "first_visit"
  | "first_campaign";
export interface IntelligenceMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly createdAt: string;
}
export interface IntelligenceConversation {
  readonly id: string;
  readonly title: string;
  readonly pinned: boolean;
  readonly messages: readonly IntelligenceMessage[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
