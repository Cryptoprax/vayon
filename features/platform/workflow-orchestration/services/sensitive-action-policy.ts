import type { ActionKind } from "@/features/platform/workflows/domain/contracts";
import { sensitiveApprovalPolicies } from "../contracts";
export interface SensitiveActionContext { readonly audienceSize?: number; readonly changesPricing?: boolean; readonly changesSubscription?: boolean; readonly providerCode?: string }
export class SensitiveWorkflowActionPolicy {
  requiresApproval(action: ActionKind, context: SensitiveActionContext = {}) {
    const policy = sensitiveApprovalPolicies.find(item => item.action === action);
    if (policy) return { required: true as const, policyId: policy.id, reason: policy.label };
    if ((action === "email.queue" || action === "whatsapp.queue" || action === "sms.queue") && (context.audienceSize ?? 0) > 1) return { required: true as const, policyId: "mass-communication", reason: "Mass communications" };
    if (context.changesPricing) return { required: true as const, policyId: "enterprise-pricing-change", reason: "Enterprise pricing changes" };
    if (context.changesSubscription) return { required: true as const, policyId: "subscription-plan-update", reason: "Subscription plan updates" };
    return { required: false as const, policyId: null, reason: "No sensitive-action policy matched." };
  }
}
