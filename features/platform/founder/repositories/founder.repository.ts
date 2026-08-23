import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FounderActivity, PlatformMetricRow } from "../types";

type ActivitySource = Readonly<{
  table: string;
  kind: string;
  title: string;
  created: string;
}>;

const activitySources: readonly ActivitySource[] = [
  { table: "organizations", kind: "organization", title: "Organization created", created: "created_at" },
  { table: "workspaces", kind: "workspace", title: "Workspace created", created: "created_at" },
  { table: "subscriptions", kind: "subscription", title: "Subscription updated", created: "updated_at" },
  { table: "billing_events", kind: "payment", title: "Billing event received", created: "created_at" },
  { table: "ai_conversations", kind: "ai", title: "AI conversation active", created: "updated_at" },
  { table: "leads", kind: "lead", title: "Lead created", created: "created_at" },
  { table: "property_projects", kind: "property", title: "Property created", created: "created_at" },
  { table: "creative_campaigns", kind: "campaign", title: "Campaign launched", created: "created_at" },
  { table: "creative_assets", kind: "creative", title: "Creative generated", created: "created_at" },
  { table: "knowledge_articles", kind: "knowledge", title: "Knowledge article published", created: "published_at" },
  { table: "support_sessions", kind: "support", title: "Support ticket opened", created: "requested_at" },
] as const;

export class FounderRepository {
  constructor(private readonly client: SupabaseClient) {}

  async metrics(): Promise<readonly PlatformMetricRow[]> {
    const { data, error } = await this.client
      .from("platform_metrics")
      .select("id,metric,value,unit,recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      metric: String(row.metric),
      value: Number(row.value),
      unit: String(row.unit),
      recordedAt: String(row.recorded_at),
    }));
  }

  async count(table: string, filters: Readonly<Record<string, string>> = {}): Promise<number | null> {
    try {
      let query = this.client.from(table).select("id", { count: "exact", head: true });
      for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
      const { count, error } = await query;
      return error ? null : count;
    } catch {
      return null;
    }
  }

  async activity(): Promise<readonly FounderActivity[]> {
    const batches = await Promise.all(activitySources.map(async (source) => {
      try {
        const { data, error } = await this.client
          .from(source.table)
          .select(`id,${source.created}`)
          .order(source.created, { ascending: false })
          .limit(4);
        if (error) return [];
        return (data ?? []).flatMap((row) => {
          const record = row as unknown as Record<string, unknown>;
          const occurredAt = record[source.created];
          return typeof occurredAt === "string" ? [{
            id: `${source.table}:${String(record.id)}`,
            kind: source.kind,
            title: source.title,
            occurredAt,
          }] : [];
        });
      } catch {
        return [];
      }
    }));
    return batches.flat().sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)).slice(0, 24);
  }
}
