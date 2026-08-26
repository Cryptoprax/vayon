import "server-only";
import { log } from "@/lib/observability/logger";
import { PaddleBillingProvider } from "../providers/paddle/paddle.provider";
import type { PaddleBillingPeriod } from "../providers/paddle/paddle-catalog";
import { billingContext } from "./billing-context";
import { PaddleCatalogService } from "./paddle-catalog.service";
import { PaddleCustomerService } from "./paddle-customer.service";

export class PaddleCheckoutService {
  constructor(
    private provider = new PaddleBillingProvider(),
    private customers = new PaddleCustomerService(),
    private catalog = new PaddleCatalogService(),
  ) {}

  async create(
    plan: string,
    period: PaddleBillingPeriod,
    seats: number,
    origin: string,
  ) {
    const context = await billingContext("manage");
    const resolved = this.catalog.resolve(plan, period);
    if (!Number.isSafeInteger(seats) || seats < 1 || seats > 10_000)
      throw new Error("Seat quantity must be between 1 and 10,000.");
    const customerId = await this.customers.getOrCreate();
    const correlationId = crypto.randomUUID();
    log("paddle.checkout.started", {
      correlationId,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      planCode: resolved.plan,
      billingPeriod: period,
    });
    const checkout = await this.provider.createCheckout({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      customerId,
      planCode: resolved.plan,
      billingPeriod: period,
      seatQuantity: seats,
      successUrl: `${origin}/vayon/settings/subscription?checkout=success`,
      cancelUrl: `${origin}/vayon/settings/subscription?checkout=cancelled`,
    });
    return { ...checkout, correlationId };
  }
}
