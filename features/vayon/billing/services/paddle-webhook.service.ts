import "server-only";
import { log } from "@/lib/observability/logger";
import { PaddleBillingProvider } from "../providers/paddle/paddle.provider";
import { PaddleSubscriptionSyncService } from "./paddle-subscription-sync.service";

export class PaddleWebhookService {
  constructor(
    private provider = new PaddleBillingProvider(),
    private sync = new PaddleSubscriptionSyncService(),
  ) {}

  async process(payload: string, signature: string) {
    const correlationId = crypto.randomUUID();
    log("paddle.webhook.received", { correlationId });
    const event = await this.provider.verifyWebhook(payload, signature);
    await this.sync.project(event.eventId, event.type, event.data);
    log("paddle.webhook.processed", {
      correlationId,
      eventId: event.eventId,
      eventType: event.type,
      retryCount: 0,
    });
    if (event.type === "payment.failed")
      log("paddle.payment.failed", { correlationId, eventId: event.eventId });
    if (event.type === "transaction.completed")
      log("paddle.checkout.completed", { correlationId, eventId: event.eventId });
    return event;
  }
}
