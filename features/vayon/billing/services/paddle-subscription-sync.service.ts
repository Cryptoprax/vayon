import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { log } from "@/lib/observability/logger";

export class PaddleSubscriptionSyncService {
  async project(eventId: string, eventType: string, data: unknown) {
    const client = createSupabaseServiceClient();
    const projectionType = ({
      "transaction.paid": "payment.succeeded",
      "transaction.payment_failed": "payment.failed",
      "subscription.activated": "subscription.updated",
      "subscription.trialing": "subscription.updated",
      "subscription.past_due": "subscription.updated",
    } as const)[eventType as "transaction.paid" | "transaction.payment_failed" | "subscription.activated" | "subscription.trialing" | "subscription.past_due"] ?? eventType;
    const { error } = await client.rpc("process_paddle_billing_event", {
      p_event_id: eventId,
      p_event_type: projectionType,
      p_payload: data,
    });
    if (error) throw error;
    log("paddle.subscription.synced", { eventId, eventType, projectionType });
  }
}
