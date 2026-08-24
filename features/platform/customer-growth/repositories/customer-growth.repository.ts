import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
type Row = Record<string, unknown>;
export class CustomerGrowthRepository {
  constructor(private readonly client: SupabaseClient) {}
  async subscriptions(): Promise<readonly Row[]> { const { data, error } = await this.client.from("subscriptions").select("id,organization_id,status,current_period_ends_at,cancel_at_period_end,seat_quantity,plan_id,updated_at").is("deleted_at", null).order("current_period_ends_at").limit(1000); if (error) throw error; return (data ?? []) as Row[]; }
  async invoices(): Promise<readonly Row[]> { const { data, error } = await this.client.from("invoices").select("id,organization_id,status,amount_due,amount_paid,currency,due_at,paid_at").order("created_at", { ascending: false }).limit(2000); if (error) throw error; return (data ?? []) as Row[]; }
  async journey(): Promise<readonly Row[]> { const { data, error } = await this.client.from("activity_events").select("id,organization_id,event_type,title,occurred_at").order("occurred_at", { ascending: false }).limit(500); if (error) throw error; return (data ?? []) as Row[]; }
}
