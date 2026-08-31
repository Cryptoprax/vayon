export type AIWorkStatus =
  | "Queued" | "Preparing" | "Generating" | "Waiting Approval"
  | "Approved" | "Executing" | "Completed" | "Failed" | "Cancelled";

export type AIWorkItem = Readonly<{
  id: string;
  name: string;
  employee: "Sarah" | "Emma" | "Alex" | "David" | "Olivia";
  category: "Marketing" | "Sales" | "CRM" | "Creative" | "Operations" | "Analytics" | "Customer Success" | "Finance";
  priority: "Critical" | "High" | "Normal";
  status: AIWorkStatus;
  stage: string;
  relatedEntity: string;
  estimatedCompletion?: string;
  progress?: number;
  evidence: readonly string[];
  approvalId?: string;
}>;

export type AIGoal = Readonly<{
  id: string;
  name: string;
  strategy: string;
  timeline: string;
  employees: readonly string[];
  actions: readonly string[];
  dependencies: readonly string[];
  approvalGates: readonly string[];
  expectedOutcome: string;
}>;

export const autonomousWork: readonly AIWorkItem[] = [
  { id: "property-revival", name: "Listing revival package", employee: "Emma", category: "Marketing", priority: "High", status: "Waiting Approval", stage: "Package review", relatedEntity: "Inactive property", evidence: ["Listing activity is below its workspace benchmark", "Brand kit and preferred campaign style are available"], approvalId: "marketing-package" },
  { id: "lead-follow-up", name: "Lead follow-up plan", employee: "Sarah", category: "Sales", priority: "High", status: "Preparing", stage: "Drafting outreach", relatedEntity: "Inactive lead", evidence: ["No recent CRM activity", "Matching inventory is available"] },
  { id: "campaign-creative", name: "Campaign creative refresh", employee: "Emma", category: "Creative", priority: "Normal", status: "Generating", stage: "Creative draft", relatedEntity: "Low-CTR campaign", evidence: ["Campaign engagement is below its workspace benchmark"] },
  { id: "viewing-plan", name: "Viewing coordination plan", employee: "Alex", category: "Operations", priority: "Normal", status: "Queued", stage: "Awaiting available calendar window", relatedEntity: "Upcoming viewings", evidence: ["Unconfirmed viewings require coordination"] },
  { id: "finance-brief", name: "Revenue risk brief", employee: "David", category: "Finance", priority: "High", status: "Completed", stage: "Brief ready", relatedEntity: "Revenue pipeline", evidence: ["Uses verified transaction and billing projections"] },
  { id: "success-pack", name: "Post-sale success pack", employee: "Olivia", category: "Customer Success", priority: "Normal", status: "Waiting Approval", stage: "Content review", relatedEntity: "Completed transaction", evidence: ["Eligible completed transaction detected"], approvalId: "customer-success-pack" },
];

export const aiGoals: readonly AIGoal[] = [
  { id: "promote-listings", name: "Promote priority listings", strategy: "Coordinate listing quality, matching and campaign preparation around verified inventory.", timeline: "30 days", employees: ["Emma", "Sarah", "Alex"], actions: ["Audit listing quality", "Prepare campaign package", "Prepare matched-buyer outreach"], dependencies: ["Published inventory", "Brand memory", "Audience consent"], approvalGates: ["Creative package", "Outbound campaign", "Budget change"], expectedOutcome: "More qualified enquiries without automatic publishing." },
];

export const automationRules = [
  ["Low listing views", "Prepare campaign", "Property intelligence"],
  ["Lead inactive", "Prepare follow-up", "Lead intelligence"],
  ["Campaign ended", "Prepare replacement", "Campaign intelligence"],
  ["Property sold", "Prepare customer success pack", "Customer success intelligence"],
] as const;

export const employeeActivity = [
  ["Sarah", "Preparing proposal", "Lead follow-up", "Approval needed"],
  ["Emma", "Creating campaign", "Creative refresh", "Approval needed"],
  ["Alex", "Scheduling viewings", "Calendar review", "Calendar dependency"],
  ["David", "Financial report", "Revenue brief", "None"],
  ["Olivia", "Referral campaign", "Success pack", "Approval needed"],
] as const;
