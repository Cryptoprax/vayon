import type { ActionKind, TriggerKind } from "@/features/platform/workflows/domain/contracts";
export const enterpriseWorkflowTriggers = ["organization.created","organization.user_invited","billing.trial_started","billing.trial_ending","billing.subscription_renewed","billing.subscription_expired","lead.created","lead.qualified","deal.stage_changed","site_visit.completed","billing.invoice_paid","support.ticket_opened","campaign.published","ai.task_completed"] as const satisfies readonly TriggerKind[];
export const enterpriseWorkflowActions = ["task.create","owner.assign","notification.create","email.queue","whatsapp.queue","sms.queue","ai.task.create","crm.record.update","meeting.schedule","report.generate","provider.call"] as const satisfies readonly ActionKind[];
export const orchestrationAgents = ["Marketing AI","Sales AI","Customer Success AI","Creative AI","Knowledge AI"] as const;
export const sensitiveApprovalPolicies = [
  { id:"large-marketing-campaign",label:"Large marketing campaigns",action:"provider.call",requiresApproval:true },
  { id:"enterprise-pricing-change",label:"Enterprise pricing changes",action:"crm.record.update",requiresApproval:true },
  { id:"mass-communication",label:"Mass communications",action:"email.queue",requiresApproval:true },
  { id:"subscription-plan-update",label:"Subscription plan updates",action:"provider.call",requiresApproval:true },
] as const satisfies readonly {id:string;label:string;action:ActionKind;requiresApproval:true}[];
