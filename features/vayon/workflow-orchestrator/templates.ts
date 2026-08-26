import type { OrchestratorStep, OrchestratorTemplate } from "./contracts";

const step = (
  id: string,
  title: string,
  description: string,
  modules: readonly string[],
  dependencies: readonly string[] = [],
  estimatedMinutes = 5,
): OrchestratorStep => ({
  id,
  title,
  description,
  modules,
  dependencies,
  status: dependencies.length ? "upcoming" : "current",
  estimatedMinutes,
  approvalRequired: true,
  executable: false,
});

const template = (
  id: string,
  name: string,
  summary: string,
  steps: readonly OrchestratorStep[],
  expectedOutputs: readonly string[],
  missingRequirements: readonly string[],
): OrchestratorTemplate => ({
  id,
  name,
  summary,
  steps,
  expectedOutputs,
  missingRequirements,
  warnings: [
    "Preview only. Confirmation does not execute module actions.",
    "Every module retains its existing permissions and approval requirements.",
  ],
});

export const orchestratorTemplates: readonly OrchestratorTemplate[] = [
  template("launch-business", "Launch Business", "Prepare a governed cross-module business launch plan.", [
    step("business-launch", "Business Launch", "Review company and operating defaults.", ["Business Launch"], [], 8),
    step("brand", "Brand identity", "Prepare the existing Brand Studio workflow.", ["Creative Studio", "Knowledge"], ["business-launch"], 10),
    step("crm", "CRM", "Prepare customer pipeline structure and import choices.", ["CRM"], ["business-launch"], 8),
    step("employees", "AI Employees", "Recommend governed workforce roles.", ["AI Workforce"], ["business-launch"], 6),
    step("campaign", "Marketing Campaign", "Prepare campaign strategy and asset brief.", ["Campaign Studio", "Images", "Videos"], ["brand", "crm"], 15),
    step("website", "Website", "Prepare website content requirements.", ["Creative Studio", "Knowledge"], ["brand"], 12),
    step("pitch", "Investor Pitch", "Prepare an investor pitch document brief.", ["Documents", "Analytics"], ["business-launch", "brand"], 12),
    step("pipeline", "Sales Pipeline", "Prepare stages and follow-up workflow.", ["CRM", "Analytics", "Notifications"], ["crm", "employees"], 10),
  ], ["Business launch checklist", "Brand brief", "CRM setup plan", "AI workforce plan", "Campaign brief", "Website brief", "Investor pitch brief", "Sales pipeline plan"], ["Company profile", "Target market", "Brand preferences", "Approved owners"]),
  template("investor-pitch", "Generate Investor Pitch", "Prepare an evidence-safe investor presentation workflow.", [step("evidence", "Collect approved evidence", "Identify verified company and analytics sources.", ["Analytics", "Knowledge"]), step("draft", "Draft pitch", "Prepare the document-generation brief.", ["Documents", "Creative Studio"], ["evidence"], 12), step("approval", "Executive approval", "Request review before any generation.", ["Founder Dashboard", "Notifications"], ["draft"], 5)], ["Pitch outline", "Evidence register", "Approval request"], ["Approved company narrative", "Verified business metrics"]),
  template("marketing-campaign", "Launch Marketing Campaign", "Plan a brand-governed campaign across creative channels.", [step("brief", "Campaign brief", "Define objective and audience.", ["Campaign Studio"]), step("assets", "Creative assets", "Prepare image and video requests.", ["Images", "Videos", "Creative Studio"], ["brief"], 15), step("review", "Campaign approval", "Review before publication.", ["Notifications", "Analytics"], ["assets"], 5)], ["Campaign brief", "Asset plan", "Approval request"], ["Campaign objective", "Audience", "Approved brand"]),
  template("import-crm", "Import CRM", "Preview a governed CRM import and validation plan.", [step("map", "Map source fields", "Review the import schema.", ["CRM"]), step("validate", "Validate records", "Preview duplicates and missing fields.", ["CRM", "Knowledge"], ["map"], 10), step("approve", "Approve import", "Require explicit confirmation in CRM.", ["CRM", "Notifications"], ["validate"], 5)], ["Field mapping", "Validation report", "Import preview"], ["CRM source file", "Field ownership rules"]),
  template("ai-sales-team", "Create AI Sales Team", "Prepare governed AI sales roles and responsibilities.", [step("roles", "Define sales roles", "Select Sales Agent responsibilities.", ["AI Workforce"]), step("knowledge", "Attach approved knowledge", "Select safe business sources.", ["Knowledge"], ["roles"], 8), step("approve", "Approve workforce plan", "Review permissions before configuration.", ["AI Workforce", "Notifications"], ["knowledge"], 5)], ["Role plan", "Knowledge scope", "Permission review"], ["Sales process", "Approved knowledge", "Role owner"]),
  ...[
    ["employee-onboarding", "Employee Onboarding", "AI Workforce", "Employee profile and onboarding checklist"],
    ["customer-success", "Customer Success Setup", "CRM", "Customer success operating plan"],
    ["sales-pipeline", "Sales Pipeline Initialization", "CRM", "Pipeline stages and review plan"],
    ["content-marketing", "Content Marketing", "Creative Studio", "Content calendar and asset briefs"],
    ["lead-generation", "Lead Generation", "Campaign Studio", "Lead-generation campaign brief"],
    ["proposal", "Proposal Creation", "Documents", "Evidence-safe proposal brief"],
    ["business-review", "Business Review", "Founder Dashboard", "Executive review and evidence checklist"],
  ].map(([id, name, module, output]) => template(id, name, `Prepare a governed ${name.toLowerCase()} workflow.`, [step("prepare", `Prepare ${name}`, "Collect requirements and preview the existing module workflow.", [module]), step("review", "Human review", "Review the plan before any module action.", [module, "Notifications"], ["prepare"], 5)], [output], ["Approved owner", "Required source information"])),
];
