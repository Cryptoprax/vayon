import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformMetricRow } from "@/features/platform/founder/types";

type Row = Record<string, unknown>;

export class MarketingDirectorRepository {
  constructor(private readonly client: SupabaseClient) {}
  async metrics(): Promise<readonly PlatformMetricRow[]> { const { data, error } = await this.client.from("platform_metrics").select("id,metric,value,unit,recorded_at").order("recorded_at", { ascending: false }).limit(1000); if (error) throw error; return (data ?? []).map((row) => ({ id: String(row.id), metric: String(row.metric), value: Number(row.value), unit: String(row.unit), recordedAt: String(row.recorded_at) })); }
  async campaigns(): Promise<readonly Row[]> { const { data, error } = await this.client.from("creative_campaigns").select("id,name,status,platforms,updated_at,created_at").order("updated_at", { ascending: false }).limit(250); if (error) throw error; return (data ?? []) as Row[]; }
  async attribution() { const [events, leads] = await Promise.all([this.client.from("marketing_events").select("event_type,metadata,created_at").order("created_at", { ascending: false }).limit(10000), this.client.from("marketing_leads").select("kind,source,status,created_at").order("created_at", { ascending: false }).limit(10000)]); return { events: events.error ? [] : (events.data ?? []) as Row[], leads: leads.error ? [] : (leads.data ?? []) as Row[] }; }
}
