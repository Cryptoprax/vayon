import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { paddleRequest } from "../providers/paddle/paddle-client";
import { PaddleBillingProvider } from "../providers/paddle/paddle.provider";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { billingContext } from "./billing-context";
import { paddleEnvironment } from "../providers/paddle/paddle-client";

export class PaddleCustomerService {
  async linked() {
    const context = await billingContext("manage");
    const { data, error } = await context.client
      .from("billing_customers")
      .select("provider_customer_id")
      .eq("organization_id", context.organizationId)
      .eq("workspace_id", context.workspaceId)
      .eq("provider", "paddle")
      .maybeSingle();
    if (error) throw error;
    return data?.provider_customer_id as string | undefined;
  }

  async getOrCreate() {
    const context = await billingContext("manage");
    const linked = await this.linked();
    if (linked) return linked;
    const [{ data: organization }, { data: contact }, { data: session }] = await Promise.all([
      context.client
        .from("organizations")
        .select("name,business_email")
        .eq("id", context.organizationId)
        .single(),
      context.client
        .from("billing_contacts")
        .select("billing_email")
        .eq("workspace_id", context.workspaceId)
        .maybeSingle(),
      context.client.auth.getUser(),
    ]);
    const email =
      contact?.billing_email ?? organization?.business_email ?? session.user?.email;
    if (!email)
      throw Object.assign(
        new Error("A billing email is required before checkout."),
        { code: "BILLING_EMAIL_REQUIRED" as const },
      );
    const customer = await paddleRequest<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify({
        email,
        name: organization?.name,
        custom_data: {
          organization_id: context.organizationId,
          workspace_id: context.workspaceId,
        },
      }),
    });
    const service = createSupabaseServiceClient();
    const { error } = await service.from("billing_customers").upsert(
      {
        organization_id: context.organizationId,
        workspace_id: context.workspaceId,
        provider: "paddle",
        provider_customer_id: customer.id,
        livemode: paddleEnvironment() === "live",
        email,
      },
      { onConflict: "workspace_id" },
    );
    if (error) throw error;
    return customer.id;
  }

  async portal(returnUrl: string) {
    const context = await billingContext("manage");
    const [customerId, subscription] = await Promise.all([
      this.linked(),
      new SubscriptionRepository(
        context.client,
        context.organizationId,
        context.workspaceId,
      ).current(),
    ]);
    if (!customerId) throw new Error("No Paddle customer is linked.");
    return new PaddleBillingProvider().createCustomerPortal({
      organizationId: context.organizationId,
      customerId,
      subscriptionId: subscription?.providerSubscriptionId,
      returnUrl,
    });
  }
}
