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
  if (!/^pro_[a-z0-9]+$/.test(productId) || !/^pri_[a-z0-9]+$/.test(priceId))
    throw new Error(`Paddle catalog IDs are invalid for ${plan} ${period}.`);
  return { productId, priceId };
}

export function planForPaddlePrice(priceId: string) {
  if (foundingMonthlyPriceId() === priceId) return { plan: "professional" as const, period: "monthly" as const };
  for (const plan of paddlePlanCodes) {
    for (const period of ["monthly", "annual"] as const) {
      if (process.env[`PADDLE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`] === priceId)
        return { plan, period };
    }
  }
  return null;
}

// Optional and server-only. Never replace the standard Professional mapping.
export function foundingMonthlyPriceId(): string | null {
  const value = process.env.PADDLE_PRICE_PROFESSIONAL_FOUNDING_MONTHLY;
  return value && /^pri_[a-z0-9]+$/.test(value) && value !== process.env.PADDLE_PRICE_PROFESSIONAL_MONTHLY ? value : null;
}
