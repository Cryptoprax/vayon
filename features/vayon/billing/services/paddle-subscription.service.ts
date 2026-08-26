import "server-only";
import { PaddleBillingProvider } from "../providers/paddle/paddle.provider";
import type { PaddleBillingPeriod } from "../providers/paddle/paddle-catalog";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { billingContext } from "./billing-context";
import { PaddleCatalogService } from "./paddle-catalog.service";

export class PaddleSubscriptionService {
  constructor(
    private provider = new PaddleBillingProvider(),
    private catalog = new PaddleCatalogService(),
  ) {}

  private async current(version: number) {
    const context = await billingContext("manage");
    const subscription = await new SubscriptionRepository(
      context.client,
      context.organizationId,
      context.workspaceId,
    ).current();
    if (!subscription?.providerSubscriptionId)
      throw new Error("An active Paddle subscription is required.");
    if (subscription.version !== version)
      throw new Error("Subscription changed. Refresh before trying again.");
    return subscription;
  }

  async change(
    plan: string,
    period: PaddleBillingPeriod,
    seats: number,
    version: number,
  ) {
    const subscription = await this.current(version);
    const catalog = this.catalog.resolve(plan, period);
    await this.provider.changeSubscription({
      customerId: "linked",
      subscriptionId: subscription.providerSubscriptionId!,
      planCode: catalog.plan,
      priceId: catalog.priceId,
      quantity: seats,
      prorationBehavior: "always_invoice",
    });
  }

  async cancel(version: number) {
    const subscription = await this.current(version);
    await this.provider.cancelSubscription(subscription.providerSubscriptionId!);
  }

  async resume(version: number) {
    const subscription = await this.current(version);
    await this.provider.reactivateSubscription(subscription.providerSubscriptionId!);
  }
}
