import "server-only";

export type PaddlePlanCode =
  | "starter"
  | "professional"
  | "business"
  | "business_plus";
export type PaddleBillingPeriod = "monthly" | "annual";

const plans: readonly PaddlePlanCode[] = [
  "starter",
  "professional",
  "business",
  "business_plus",
];

export function isPaddlePlanCode(value: string): value is PaddlePlanCode {
  return plans.includes(value as PaddlePlanCode);
}

export function paddleCatalogEntry(
  plan: PaddlePlanCode,
  period: PaddleBillingPeriod,
) {
  const suffix = `${plan.toUpperCase()}_${period.toUpperCase()}`;
  const productId = process.env[`PADDLE_PRODUCT_${plan.toUpperCase()}`];
  const priceId = process.env[`PADDLE_PRICE_${suffix}`];
  if (!productId || !priceId)
    throw new Error(`Paddle catalog is not configured for ${plan} ${period}.`);
  return { productId, priceId };
}

export function planForPaddlePrice(priceId: string) {
  for (const plan of plans) {
    for (const period of ["monthly", "annual"] as const) {
      if (process.env[`PADDLE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`] === priceId)
        return { plan, period };
    }
  }
  return null;
}
