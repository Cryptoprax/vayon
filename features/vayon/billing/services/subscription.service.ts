import "server-only";
import { StripeBillingProvider } from "../providers/stripe.provider";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { billingContext } from "./billing-context";
export class SubscriptionService {
  constructor(private provider = new StripeBillingProvider()) {}
  private async repo(access:"read"|"manage"="read"){const c=await billingContext(access);return new SubscriptionRepository(c.client,c.organizationId,c.workspaceId)}
  async plans(){return(await this.repo()).plans()}
  async current(){return(await this.repo()).current()}
  async change(plan:string,seats:number,version:number){const repo=await this.repo("manage"),current=await repo.current();if(!current?.providerSubscriptionId)throw new Error("An active Stripe subscription is required. Use Checkout to subscribe.");if(current.version!==version)throw new Error("Subscription changed. Refresh before trying again.");const priceId=process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];if(!priceId)throw new Error(`Stripe price is not configured for ${plan}.`);await this.provider.changeSubscription({customerId:"managed",subscriptionId:current.providerSubscriptionId,planCode:plan,priceId,quantity:seats,prorationBehavior:"always_invoice"})}
  async cancel(version:number){const repo=await this.repo("manage"),current=await repo.current();if(!current?.providerSubscriptionId)throw new Error("An active Stripe subscription is required.");if(current.version!==version)throw new Error("Subscription changed. Refresh before trying again.");await this.provider.cancelSubscription(current.providerSubscriptionId)}
  async reactivate(version:number){const repo=await this.repo("manage"),current=await repo.current();if(!current?.providerSubscriptionId)throw new Error("An active Stripe subscription is required.");if(current.version!==version)throw new Error("Subscription changed. Refresh before trying again.");await this.provider.reactivateSubscription(current.providerSubscriptionId)}
}
