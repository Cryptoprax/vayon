import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { log } from "@/lib/observability/logger";

export class PaddleSubscriptionSyncService {
  async project(eventId: string, eventType: string, data: unknown) {
    const client = createSupabaseServiceClient();
    const { error } = await client.rpc("process_paddle_billing_event", {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload: data,
    });
    if (error) throw error;
    log("paddle.subscription.synced", { eventId, eventType });
  }
}
