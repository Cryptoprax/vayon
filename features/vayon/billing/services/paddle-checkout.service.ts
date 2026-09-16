import "server-only";
import { log } from "@/lib/observability/logger";
import { PaddleBillingProvider } from "../providers/paddle/paddle.provider";
import type { PaddleBillingPeriod } from "../providers/paddle/paddle-catalog";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { billingContext } from "./billing-context";
import { PaddleCatalogService } from "./paddle-catalog.service";
import { PaddleCustomerService } from "./paddle-customer.service";
import { FoundingMemberService } from "./founding-member.service";
import { foundingMonthlyPriceId } from "../providers/paddle/paddle-catalog";

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
    onStage?: (stage: "checkout.auth_validated" | "checkout.context_validated" | "checkout.config_validated" | "checkout.customer_create_started" | "checkout.transaction_create_started" | "checkout.transaction_created") => void,
  ) {
    const context = await billingContext("manage");
    onStage?.("checkout.auth_validated");
    const current = await new SubscriptionRepository(context.client, context.organizationId, context.workspaceId).current();
    onStage?.("checkout.context_validated");
    if (current?.providerSubscriptionId && current.status !== "cancelled") throw new Error("Manage your existing subscription from the Subscription Center.");
    const resolved = this.catalog.resolve(plan, period);
    onStage?.("checkout.config_validated");
    if (!Number.isSafeInteger(seats) || seats < 1 || seats > 10_000)
      throw new Error("Seat quantity must be between 1 and 10,000.");
    const founding = resolved.plan === "professional" ? new FoundingMemberService() : null;
    if (founding) await founding.assertCheckoutAllowed(context.organizationId);
    onStage?.("checkout.customer_create_started");
    const customerId = await this.customers.getOrCreate();
    const correlationId = crypto.randomUUID();
    log("paddle.checkout.started", {
      correlationId,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      planCode: resolved.plan,
      billingPeriod: period,
    });
    onStage?.("checkout.transaction_create_started");
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
    if (founding && period === "monthly" && foundingMonthlyPriceId()) {
      const allocation = await founding.reserve({ organizationId: context.organizationId,
        workspaceId: context.workspaceId, customerId, transactionId: checkout.transactionId });
      if (allocation) {
        try { await founding.applyPrice(allocation, seats); }
        catch (error) {
          // An ambiguous PATCH may have succeeded. Release only after Paddle has
          // canceled it; the scheduled reconciler handles a failed cancellation.
          await founding.cancelReservation(allocation).catch(() => undefined);
          throw error;
        }
      }
    }
    onStage?.("checkout.transaction_created");
    return { ...checkout, correlationId };
  }
}
