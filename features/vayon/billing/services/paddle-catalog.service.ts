import "server-only";
import {
  isPaddlePlanCode,
  paddleCatalogEntry,
  planForPaddlePrice,
  paddlePlanCodes,
  type PaddleBillingPeriod,
} from "../providers/paddle/paddle-catalog";
import { paddleRequest } from "../providers/paddle/paddle-client";
import type { PaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";

type PaddlePrice = {
  id: string;
  product_id: string;
  status: "active" | "archived";
  unit_price: { amount: string; currency_code: string };
  product?: { id: string; name: string; description: string | null };
};

export class PaddleCatalogService {
  resolve(plan: string, period: PaddleBillingPeriod) {
    if (!isPaddlePlanCode(plan))
      throw new Error("Invalid Paddle subscription plan.");
    return { plan, period, ...paddleCatalogEntry(plan, period) };
  }

  resolvePrice(priceId: string) {
    return planForPaddlePrice(priceId);
  }

  async list(): Promise<PaddleCatalogPrice[]> {
    return Promise.all(
      paddlePlanCodes.flatMap((plan) =>
        (["monthly", "annual"] as const).map(async (period) => {
          const configured = this.resolve(plan, period);
          const price = await paddleRequest<PaddlePrice>(
            `/prices/${encodeURIComponent(configured.priceId)}?include=product`,
          );
          if (
            price.id !== configured.priceId ||
            price.product_id !== configured.productId ||
            price.product?.id !== configured.productId ||
            price.status !== "active"
          )
            throw new Error(`Paddle catalog mismatch for ${plan} ${period}.`);
          return {
            plan,
            period,
            productId: configured.productId,
            priceId: configured.priceId,
            name: price.product.name,
            description: price.product.description,
            amount: price.unit_price.amount,
            currencyCode: price.unit_price.currency_code,
          };
        }),
      ),
    );
  }
}
