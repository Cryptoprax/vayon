export type CommercialPlanCode = "starter" | "professional" | "business" | "business_plus" | "enterprise";

export interface CommercialPricingPlan {
  readonly code: CommercialPlanCode;
  readonly name: string;
  readonly audience: string;
  readonly description: string;
  readonly standardMonthlyPrice: number | null;
  readonly seats: string;
  readonly workspaces: string;
  readonly storage: string;
  readonly selfService: boolean;
  readonly popular?: boolean;
  readonly promotion?: {
    readonly type: "founding_member";
    readonly enabled: boolean;
    readonly promotionalMonthlyPrice: number;
    readonly limitAgencies: number;
    readonly durationMonths: number;
  };
}

export const ANNUAL_SAVINGS_PERCENT = 20;
export const FOUNDING_MEMBER_SPOTS_REMAINING = 20;
// Presentation metadata only. Availability must be supplied by the server.
export const FOUNDING_MEMBER_ENABLED = true;

export const commercialPricingPlans: readonly CommercialPricingPlan[] = [
  { code: "starter", name: "Starter", audience: "Independent agents and small real estate teams", description: "Launch your business with AI", standardMonthlyPrice: 79, seats: "3", workspaces: "1", storage: "10 GB", selfService: true },
  { code: "professional", name: "Professional", audience: "Growing teams", description: "Grow with AI employees", standardMonthlyPrice: 149, seats: "10", workspaces: "3", storage: "100 GB", selfService: true, popular: true, promotion: { type: "founding_member", enabled: FOUNDING_MEMBER_ENABLED, promotionalMonthlyPrice: 79, limitAgencies: FOUNDING_MEMBER_SPOTS_REMAINING, durationMonths: 12 } },
  { code: "business", name: "Business", audience: "Established businesses", description: "Run your organization with AI", standardMonthlyPrice: 399, seats: "50", workspaces: "10", storage: "500 GB", selfService: true },
  { code: "business_plus", name: "Business Plus", audience: "Multi-department operations", description: "Scale teams and locations", standardMonthlyPrice: 799, seats: "Custom", workspaces: "Custom", storage: "Custom", selfService: true },
  { code: "enterprise", name: "Enterprise", audience: "Large organizations", description: "Dedicated enterprise operating system", standardMonthlyPrice: null, seats: "Unlimited", workspaces: "Unlimited", storage: "Custom", selfService: false },
];

export const selfServiceCommercialPlans = commercialPricingPlans.filter((plan) => plan.selfService);

export function commercialAnnualMonthlyPrice(plan: CommercialPricingPlan): number | null {
  return plan.standardMonthlyPrice === null ? null : Math.round(plan.standardMonthlyPrice * (1 - ANNUAL_SAVINGS_PERCENT / 100) * 100) / 100;
}

export function commercialDisplayPrice(plan: CommercialPricingPlan, period: "monthly" | "annual", foundingAvailable = false) {
  if (plan.standardMonthlyPrice === null) return { price: null, standardPrice: null, promotional: false };
  if (period === "monthly" && plan.promotion?.enabled && foundingAvailable) return { price: plan.promotion.promotionalMonthlyPrice, standardPrice: plan.standardMonthlyPrice, promotional: true };
  return { price: period === "annual" ? commercialAnnualMonthlyPrice(plan) : plan.standardMonthlyPrice, standardPrice: null, promotional: false };
}


