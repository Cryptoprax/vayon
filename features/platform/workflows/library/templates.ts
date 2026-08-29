import type {
  ActionKind,
  TriggerKind,
  WorkflowTemplate,
} from "../domain/contracts";

const platformSpecs = [
  ["new-lead-follow-up", "New Lead Follow-up", "Sales", "lead.created", "crm.task.recommend"],
  ["hot-lead-escalation", "Hot Lead Escalation", "Sales", "lead.updated", "user.notify"],
  ["deal-at-risk", "Deal At Risk", "Sales", "deal.stage_changed", "ai.recommend"],
  ["trial-ending", "Trial Ending", "Billing", "billing.trial_ending", "email.queue"],
  ["payment-failed", "Payment Failed", "Billing", "billing.payment_failed", "user.notify"],
  ["customer-onboarding", "Customer Onboarding", "Customer", "organization.user_joined", "crm.task.recommend"],
  ["meeting-reminder", "Meeting Reminder", "Operations", "time.reminder", "user.notify"],
  ["executive-daily-brief", "Executive Daily Brief", "Executive", "time.scheduled", "executive.report"],
  ["marketing-campaign-review", "Marketing Campaign Review", "Marketing", "time.recurring", "approval.request"],
] as const satisfies ReadonlyArray<
  readonly [string, string, string, TriggerKind, ActionKind]
>;

const realEstateSpecs = [
  ["buyer-qualification", "Buyer Qualification", "Real Estate", "lead.created", "crm.task.recommend"],
  ["seller-onboarding", "Seller Onboarding", "Real Estate", "contact.created", "crm.task.recommend"],
  ["property-listing", "Property Listing", "Real Estate", "property.created", "approval.request"],
  ["property-verification", "Property Verification", "Real Estate", "property.created", "task.create"],
  ["lead-qualification", "Lead Qualification", "Real Estate", "lead.created", "ai.recommend"],
  ["property-matching", "Property Matching", "Real Estate", "lead.qualified", "ai.recommend"],
  ["site-visit", "Site Visit", "Real Estate", "meeting.scheduled", "reminder.create"],
  ["offer-management", "Offer Management", "Real Estate", "deal.stage_changed", "approval.request"],
  ["negotiation", "Negotiation", "Real Estate", "deal.stage_changed", "crm.task.recommend"],
  ["booking", "Booking", "Real Estate", "deal.won", "task.create"],
  ["loan-processing", "Loan Processing", "Real Estate", "deal.stage_changed", "crm.task.recommend"],
  ["registration", "Registration", "Real Estate", "deal.won", "task.create"],
  ["property-handover", "Property Handover", "Real Estate", "deal.won", "task.create"],
  ["after-sales-follow-up", "After Sales Follow-up", "Real Estate", "deal.won", "crm.task.recommend"],
  ["referral-campaign", "Referral Campaign", "Real Estate", "deal.won", "approval.request"],
] as const satisfies ReadonlyArray<readonly [string, string, string, TriggerKind, ActionKind]>;

const specs = [...realEstateSpecs, ...platformSpecs] as const;

export const workflowTemplates: readonly WorkflowTemplate[] = Object.freeze(
  specs.map(([id, name, category, trigger, action]) =>
    Object.freeze({
      id,
      name,
      description: `Governed ${name.toLowerCase()} automation.`,
      category,
      industryVisibility: category === "Real Estate" ? ["REAL_ESTATE"] as const : ["GENERAL"] as const,
      roleVisibility: category === "Real Estate" ? ["Founder", "Super Admin", "Admin", "Manager", "Agent", "Employee", "Viewer"] as const : ["Founder", "Super Admin"] as const,
      definition: Object.freeze({
        id: `template-${id}`,
        name,
        description: `${name} template`,
        version: 1,
        status: "draft" as const,
        nodes: Object.freeze([
          {
            id: "trigger",
            kind: "trigger" as const,
            label: `Trigger: ${trigger}`,
            position: { x: 80, y: 120 },
            configuration: { trigger },
            variableReferences: [],
          },
          {
            id: "approval",
            kind: "approval" as const,
            label: "Human approval",
            position: { x: 320, y: 120 },
            configuration: { required: true },
            variableReferences: [],
          },
          {
            id: "action",
            kind: "task" as const,
            label: action,
            position: { x: 560, y: 120 },
            configuration: {
              action,
              recommendationOnly: true,
              approvalRequired: true,
            },
            variableReferences: [],
          },
          {
            id: "end",
            kind: "end" as const,
            label: "End",
            position: { x: 800, y: 120 },
            configuration: {},
            variableReferences: [],
          },
        ]),
        connections: Object.freeze([
          { id: "trigger-approval", sourceNodeId: "trigger", targetNodeId: "approval" },
          { id: "approval-action", sourceNodeId: "approval", targetNodeId: "action" },
          { id: "action-end", sourceNodeId: "action", targetNodeId: "end" },
        ]),
        variables: Object.freeze([]),
      }),
    }),
  ),
);

export function cloneWorkflowTemplate(templateId: string, workflowId: string) {
  const template = workflowTemplates.find((item) => item.id === templateId);
  if (!template) return undefined;
  return Object.freeze({
    ...template.definition,
    id: workflowId,
    name: `${template.name} copy`,
    status: "draft" as const,
    version: 1,
  });
}
