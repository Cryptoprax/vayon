import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingProvider,
  BillingProviderChangeInput,
  BillingProviderCheckoutInput,
  BillingProviderPortalInput,
} from "../billing-provider";
import { paddleRequest } from "./paddle-client";
import { paddleCatalogEntry, type PaddleBillingPeriod } from "./paddle-catalog";

const supportedEvents = new Set([
  "transaction.completed",
  "transaction.paid",
  "transaction.payment_failed",
  "subscription.created",
  "subscription.activated",
  "subscription.trialing",
  "subscription.past_due",
  "subscription.updated",
  "subscription.paused",
  "subscription.resumed",
  "subscription.canceled",
  "payment.failed",
  "payment.succeeded",
  "customer.updated",
]);

export class PaddleWebhookSignatureError extends Error {
  constructor(message = "Paddle webhook signature verification failed.") {
    super(message);
    this.name = "PaddleWebhookSignatureError";
  }
}

type PaddleWebhookEnvelope = {
  event_id: string;
  event_type: string;
  data: unknown;
};

export class PaddleBillingProvider implements BillingProvider {
  readonly id = "paddle";

  async createCheckout(
    input: BillingProviderCheckoutInput & { billingPeriod?: PaddleBillingPeriod },
  ) {
    const period = input.billingPeriod ?? "monthly";
    const { priceId } = paddleCatalogEntry(
      input.planCode as Parameters<typeof paddleCatalogEntry>[0],
      period,
    );
    const transaction = await paddleRequest<{ checkout: { url: string | null } }>(
      "/transactions",
      {
        method: "POST",
        body: JSON.stringify({
          items: [{ price_id: priceId, quantity: input.seatQuantity }],
          collection_mode: "automatic",
          customer_id: input.customerId,
          custom_data: {
            organization_id: input.organizationId,
            workspace_id: input.workspaceId,
            plan_code: input.planCode,
            billing_period: period,
          },
        }),
      },
    );
    if (!transaction.checkout.url)
      throw new Error("Paddle did not return a checkout URL.");
    return { url: transaction.checkout.url };
  }

  async createCustomerPortal(input: BillingProviderPortalInput) {
    if (!input.customerId)
      throw new Error("A linked Paddle customer is required.");
    const session = await paddleRequest<{
      urls: { general: { overview: string } };
    }>(`/customers/${encodeURIComponent(input.customerId)}/portal-sessions`, {
      method: "POST",
      body: JSON.stringify({
        subscription_ids: input.subscriptionId ? [input.subscriptionId] : [],
      }),
    });
    return { url: session.urls.general.overview };
  }

  async changeSubscription(input: BillingProviderChangeInput) {
    await paddleRequest(`/subscriptions/${encodeURIComponent(input.subscriptionId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        items: [{ price_id: input.priceId, quantity: input.quantity }],
        proration_billing_mode: "prorated_immediately",
        custom_data: { plan_code: input.planCode },
      }),
    });
  }

  async cancelSubscription(subscriptionId: string) {
    await paddleRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ effective_from: "next_billing_period" }),
    });
  }

  async reactivateSubscription(subscriptionId: string) {
    await paddleRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}/resume`, {
      method: "POST",
      body: JSON.stringify({ effective_from: "immediately" }),
    });
  }

  async recordUsage() {
    throw new Error("Paddle usage metering is not enabled for this catalog.");
  }

  async verifyWebhook(payload: string, signatureHeader: string) {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret) throw new Error("PADDLE_WEBHOOK_SECRET is required.");
    const entries = signatureHeader.split(";").map((part) => part.split("="));
    const timestamp = entries.find(([key]) => key === "ts")?.[1];
    const signatures = entries
      .filter(([key]) => key === "h1")
      .map(([, value]) => value)
      .filter(Boolean) as string[];
    if (!timestamp || signatures.length === 0)
      throw new PaddleWebhookSignatureError();
    const issuedAt = Number(timestamp);
    const tolerance = Number(process.env.PADDLE_WEBHOOK_TOLERANCE_SECONDS ?? 300);
    if (!Number.isSafeInteger(issuedAt) || Math.abs(Date.now() / 1000 - issuedAt) > tolerance)
      throw new PaddleWebhookSignatureError("Paddle webhook timestamp expired.");
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}:${payload}`, "utf8")
      .digest("hex");
    const valid = signatures.some((signature) => {
      const actual = Buffer.from(signature, "hex");
      const candidate = Buffer.from(expected, "hex");
      return actual.length === candidate.length && timingSafeEqual(actual, candidate);
    });
    if (!valid) throw new PaddleWebhookSignatureError();
    const envelope = JSON.parse(payload) as PaddleWebhookEnvelope;
    if (!envelope.event_id || !envelope.event_type)
      throw new PaddleWebhookSignatureError("Invalid Paddle event envelope.");
    return {
      eventId: envelope.event_id,
      type: supportedEvents.has(envelope.event_type)
        ? envelope.event_type
        : envelope.event_type,
      data: envelope.data,
    };
  }
}
