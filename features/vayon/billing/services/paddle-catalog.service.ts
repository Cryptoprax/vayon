import "server-only";
import {
  isPaddlePlanCode,
  paddleCatalogEntry,
  planForPaddlePrice,
  type PaddleBillingPeriod,
} from "../providers/paddle/paddle-catalog";

export class PaddleCatalogService {
  resolve(plan: string, period: PaddleBillingPeriod) {
    if (!isPaddlePlanCode(plan))
      throw new Error("Invalid Paddle subscription plan.");
    return { plan, period, ...paddleCatalogEntry(plan, period) };
  }

  resolvePrice(priceId: string) {
    return planForPaddlePrice(priceId);
  }
}
