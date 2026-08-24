import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformMetricRow } from "@/features/platform/founder/types";

type Row = Record<string, unknown>;
export class SalesDirectorRepository {
  constructor(private readonly client: SupabaseClient) {}
  async metrics(): Promise<readonly PlatformMetricRow[]> { const { data, error } = await this.client.from("platform_metrics").select("id,metric,value,unit,recorded_at").order("recorded_at", { ascending: false }).limit(1500); if (error) throw error; return (data ?? []).map((row) => ({ id: String(row.id), metric: String(row.metric), value: Number(row.value), unit: String(row.unit), recordedAt: String(row.recorded_at) })); }
  async count(table: string, filters: Readonly<Record<string, string>> = {}) { let query = this.client.from(table).select("id", { count: "exact", head: true }); for (const [column, value] of Object.entries(filters)) query = query.eq(column, value); const { count, error } = await query; if (error) throw error; return count ?? 0; }
  async timeline(): Promise<readonly Row[]> { const { data, error } = await this.client.from("activity_events").select("id,event_type,title,description,occurred_at").order("occurred_at", { ascending: false }).limit(100); if (error) throw error; return (data ?? []) as Row[]; }
}
