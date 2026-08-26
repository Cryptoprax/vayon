export type PaddlePlanCode =
  | "starter"
  | "professional"
  | "business"
  | "business_plus";
export type PaddleBillingPeriod = "monthly" | "annual";

export type PaddleCatalogPrice = {
  plan: PaddlePlanCode;
  period: PaddleBillingPeriod;
  productId: string;
  priceId: string;
  name: string;
  description: string | null;
  amount: string;
  currencyCode: string;
};
