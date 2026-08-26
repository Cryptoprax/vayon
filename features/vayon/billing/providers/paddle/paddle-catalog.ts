import "server-only";

import type {
  PaddleBillingPeriod,
  PaddlePlanCode,
} from "./paddle-catalog.types";

export type {
  PaddleBillingPeriod,
  PaddlePlanCode,
} from "./paddle-catalog.types";

export const paddlePlanCodes: readonly PaddlePlanCode[] = [
  "starter",
  "professional",
  "business",
  "business_plus",
];

export function isPaddlePlanCode(value: string): value is PaddlePlanCode {
  return paddlePlanCodes.includes(value as PaddlePlanCode);
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
  for (const plan of paddlePlanCodes) {
    for (const period of ["monthly", "annual"] as const) {
      if (process.env[`PADDLE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`] === priceId)
        return { plan, period };
    }
  }
  return null;
}
