export const planCodes = ["starter", "professional", "business", "enterprise"] as const;
export type SubscriptionPlanCode = (typeof planCodes)[number];

export const entitlementFeatures = [
  "crm", "calendar", "basic_ai", "knowledge", "email", "integrations_marketplace",
  "marketing_ai", "sales_ai", "customer_success", "creative_studio", "workflow_automation",
  "google", "microsoft", "whatsapp", "advanced_ai", "advanced_analytics", "automation",
  "approvals", "api", "priority_support", "white_label", "sso", "custom_domain", "audit",
  "custom_roles", "advanced_security", "priority_ai", "founder_tools",
] as const;
export type EntitlementFeature = (typeof entitlementFeatures)[number];

export const quotaKeys = [
  "workspaces", "users", "storage_gb", "ai_requests", "exports", "reports", "workflows",
  "automations", "integrations", "knowledge_articles", "creative_assets", "api_calls",
] as const;
export type EntitlementQuota = (typeof quotaKeys)[number];
export type EntitlementState = "enabled" | "disabled" | "limited" | "quota" | "expiration" | "trial";

export interface SubscriptionEntitlementPlan {
  readonly code: SubscriptionPlanCode;
  readonly name: string;
  readonly audience: string;
  readonly features: readonly EntitlementFeature[];
  readonly quotas: Readonly<Record<EntitlementQuota, number | null>>;
}

const starterFeatures = ["crm", "calendar", "basic_ai", "knowledge", "email"] as const;
const professionalFeatures = [
  ...starterFeatures, "integrations_marketplace", "marketing_ai", "sales_ai", "customer_success",
  "creative_studio", "workflow_automation", "google", "microsoft", "whatsapp", "automation",
] as const;
const businessFeatures = [
  ...professionalFeatures, "advanced_ai", "advanced_analytics", "approvals", "api", "priority_support",
] as const;

export const subscriptionEntitlementCatalog = Object.freeze({
  starter: {
    code: "starter", name: "Starter", audience: "Freelancers", features: starterFeatures,
    quotas: { workspaces: 1, users: 3, storage_gb: 10, ai_requests: 1_000, exports: 25, reports: 25, workflows: 0, automations: 0, integrations: 0, knowledge_articles: 100, creative_assets: 25, api_calls: 0 },
  },
  professional: {
    code: "professional", name: "Professional", audience: "Small businesses", features: professionalFeatures,
    quotas: { workspaces: 3, users: 10, storage_gb: 100, ai_requests: 10_000, exports: 500, reports: 500, workflows: 100, automations: 100, integrations: 5, knowledge_articles: 1_000, creative_assets: 500, api_calls: 10_000 },
  },
  business: {
    code: "business", name: "Business", audience: "Growing companies", features: businessFeatures,
    quotas: { workspaces: 10, users: 50, storage_gb: 500, ai_requests: 50_000, exports: 2_500, reports: 2_500, workflows: 1_000, automations: 1_000, integrations: 25, knowledge_articles: 10_000, creative_assets: 2_500, api_calls: 100_000 },
  },
  enterprise: {
    code: "enterprise", name: "Enterprise", audience: "Enterprise organizations", features: entitlementFeatures,
    quotas: { workspaces: null, users: null, storage_gb: null, ai_requests: null, exports: null, reports: null, workflows: null, automations: null, integrations: null, knowledge_articles: null, creative_assets: null, api_calls: null },
  },
} satisfies Record<SubscriptionPlanCode, SubscriptionEntitlementPlan>);

export function isSubscriptionPlanCode(value: string): value is SubscriptionPlanCode {
  return planCodes.includes(value as SubscriptionPlanCode);
}

export function minimumPlanFor(feature: EntitlementFeature): SubscriptionPlanCode | null {
  return planCodes.find((code) => (subscriptionEntitlementCatalog[code].features as readonly EntitlementFeature[]).includes(feature)) ?? null;
}
