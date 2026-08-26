import "server-only";
import { PaddleBillingProvider } from "../providers/paddle/paddle.provider";
import { paddleCatalogEntry } from "../providers/paddle/paddle-catalog";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { billingContext } from "./billing-context";
export class SubscriptionService {
  constructor(private provider = new PaddleBillingProvider()) {}
  private async repo(access:"read"|"manage"="read"){const c=await billingContext(access);return new SubscriptionRepository(c.client,c.organizationId,c.workspaceId)}
  async plans(){return(await this.repo()).plans()}
  async current(){return(await this.repo()).current()}
  async change(plan:string,seats:number,version:number){const repo=await this.repo("manage"),current=await repo.current();if(!current?.providerSubscriptionId)throw new Error("An active Paddle subscription is required. Use Checkout to subscribe.");if(current.version!==version)throw new Error("Subscription changed. Refresh before trying again.");if(plan==="enterprise")throw new Error("Enterprise subscriptions are managed by sales.");const {priceId}=paddleCatalogEntry(plan as Parameters<typeof paddleCatalogEntry>[0],"monthly");await this.provider.changeSubscription({customerId:"managed",subscriptionId:current.providerSubscriptionId,planCode:plan,priceId,quantity:seats,prorationBehavior:"always_invoice"})}
  async cancel(version:number){const repo=await this.repo("manage"),current=await repo.current();if(!current?.providerSubscriptionId)throw new Error("An active Paddle subscription is required.");if(current.version!==version)throw new Error("Subscription changed. Refresh before trying again.");await this.provider.cancelSubscription(current.providerSubscriptionId)}
  async reactivate(version:number){const repo=await this.repo("manage"),current=await repo.current();if(!current?.providerSubscriptionId)throw new Error("An active Paddle subscription is required.");if(current.version!==version)throw new Error("Subscription changed. Refresh before trying again.");await this.provider.reactivateSubscription(current.providerSubscriptionId)}
}
