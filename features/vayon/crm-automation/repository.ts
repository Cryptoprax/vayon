import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrmAutomationDashboard, PropertyCrmDashboard } from "./domain";

type Row = Record<string, unknown>;
const text = (value: unknown) => value == null ? "" : String(value);
const number = (value: unknown) => value == null ? 0 : Number(value);

export class CrmAutomationRepository {
  constructor(
    private client: SupabaseClient,
    private organizationId: string,
    private workspaceId: string,
  ) {}

  private table(name: string) {
    return this.client.from(name).select("*")
      .eq("organization_id", this.organizationId).eq("workspace_id", this.workspaceId);
  }

  async property(id: string): Promise<PropertyCrmDashboard> {
    const [recommendations, interests, visits, deals, activity, property] = await Promise.all([
      this.table("crm_property_recommendations").eq("property_id", id).order("overall_score", { ascending: false }).limit(100),
      this.table("lead_property_interests").eq("property_id", id),
      this.table("site_visits").eq("property_id", id),
      this.table("deals").eq("property_id", id).is("deleted_at", null),
      this.table("activity_events").eq("related_type", "property").eq("related_id", id).order("occurred_at", { ascending: false }).limit(50),
      this.table("properties").eq("id", id).is("deleted_at", null).maybeSingle(),
    ]);
    for (const result of [recommendations, interests, visits, deals, activity, property]) {
      if (result.error) throw result.error;
    }

    const recs = (recommendations.data ?? []) as Row[];
    const leadIds = recs.map((row) => text(row.lead_id));
    const { data: leads, error: leadError } = leadIds.length
      ? await this.client.from("leads").select("id,name,interest_level")
        .eq("organization_id", this.organizationId).eq("workspace_id", this.workspaceId).in("id", leadIds)
      : { data: [], error: null };
    if (leadError) throw leadError;

    const dealRows = (deals.data ?? []) as Row[];
    const dealIds = dealRows.map((row) => text(row.id));
    const { count: offerCount, error: offerError } = dealIds.length
      ? await this.client.from("deal_offers").select("id", { count: "exact", head: true })
        .eq("organization_id", this.organizationId).eq("workspace_id", this.workspaceId).in("deal_id", dealIds)
      : { count: 0, error: null };
    if (offerError) throw offerError;

    const leadMap = new Map(((leads ?? []) as Row[]).map((row) => [text(row.id), row]));
    const won = dealRows.filter((row) => ["completed", "won"].includes(text(row.stage_id)));
    const ownerId = text((property.data as Row | null)?.assigned_agent_id);
    const { data: profile } = ownerId
      ? await this.client.from("user_profiles").select("name,email").eq("user_id", ownerId).maybeSingle()
      : { data: null };

    return {
      interestedLeads: new Set([
        ...(interests.data ?? []).map((row: Row) => text(row.lead_id)), ...leadIds,
      ]).size,
      viewingRequests: (visits.data ?? []).length,
      savedBy: (interests.data ?? []).length,
      hotProspects: recs.filter((row) => number(row.overall_score) >= 70).length,
      averageMatchScore: recs.length ? recs.reduce((sum, row) => sum + number(row.overall_score), 0) / recs.length : 0,
      conversion: dealRows.length ? won.length / dealRows.length * 100 : 0,
      offers: offerCount ?? 0,
      owner: text((profile as Row | null)?.name) || text((profile as Row | null)?.email) || "Unassigned",
      prospects: recs.slice(0, 10).map((row) => ({
        id: text(row.lead_id),
        name: text(leadMap.get(text(row.lead_id))?.name) || "Prospect",
        score: number(row.overall_score),
        interest: text(leadMap.get(text(row.lead_id))?.interest_level) || "cold",
      })),
      timeline: ((activity.data ?? []) as Row[]).map((row) => ({
        id: text(row.id), title: text(row.title), detail: text(row.description) || undefined,
        occurredAt: text(row.occurred_at),
      })),
    };
  }

  async dashboard(): Promise<CrmAutomationDashboard> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const month = new Date(start.getFullYear(), start.getMonth(), 1).toISOString();
    const today = start.toISOString();
    const [leads, deals, meetings, visits, activity] = await Promise.all([
      this.table("leads").is("deleted_at", null).limit(1000),
      this.table("deals").is("deleted_at", null).limit(1000),
      this.table("meetings").gte("starts_at", today).limit(500),
      this.table("site_visits").gte("starts_at", today).limit(500),
      this.table("activity_events").gte("occurred_at", today).limit(1000),
    ]);
    for (const result of [leads, deals, meetings, visits, activity]) if (result.error) throw result.error;

    const leadRows = (leads.data ?? []) as Row[];
    const dealRows = (deals.data ?? []) as Row[];
    const activityRows = (activity.data ?? []) as Row[];
    const won = dealRows.filter((row) => ["completed", "won"].includes(text(row.stage_id)));
    const rank = (values: string[]) => [...values.reduce(
      (map, value) => value ? map.set(value, (map.get(value) ?? 0) + 1) : map,
      new Map<string, number>(),
    )].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const topAgentId = rank(leadRows.map((row) => text(row.assigned_agent_id)));
    const topCompanyId = rank(leadRows.map((row) => text(row.company_id)));
    const [{ data: agent }, { data: company }] = await Promise.all([
      topAgentId ? this.client.from("user_profiles").select("name,email").eq("user_id", topAgentId).maybeSingle() : { data: null },
      topCompanyId ? this.table("crm_companies").eq("id", topCompanyId).maybeSingle() : { data: null },
    ]);
    const budgets = leadRows.map((row) => number(row.budget)).filter(Boolean);
    const closedDays = won.map((row) => Math.max(0,
      (new Date(text(row.updated_at)).getTime() - new Date(text(row.created_at)).getTime()) / 86_400_000,
    ));
    const rankedLabel = (value: string) => value || "Not enough data";

    return {
      todaysCalls: activityRows.filter((row) => text(row.event_type).includes("call")).length,
      todaysMeetings: (meetings.data ?? []).length,
      siteVisits: (visits.data ?? []).length,
      newLeads: leadRows.filter((row) => new Date(text(row.created_at)) >= start).length,
      followUpsDue: leadRows.filter((row) => row.follow_up_due_at && new Date(text(row.follow_up_due_at)) <= new Date()).length,
      pendingDeals: dealRows.length - won.length,
      revenueForecast: dealRows.reduce((sum, row) => sum + number(row.value) * number(row.probability) / 100, 0),
      conversion: dealRows.length ? won.length / dealRows.length * 100 : 0,
      averageDaysToClose: closedDays.length ? closedDays.reduce((a, b) => a + b, 0) / closedDays.length : 0,
      averageBudget: budgets.length ? budgets.reduce((a, b) => a + b, 0) / budgets.length : 0,
      topLocations: [rankedLabel(rank(leadRows.flatMap((row) => Array.isArray(row.preferred_locations) ? row.preferred_locations.map(String) : [])))],
      topPropertyTypes: [rankedLabel(rank(leadRows.map((row) => text(row.property_type))))],
      topSalesperson: text((agent as Row | null)?.name) || text((agent as Row | null)?.email) || "Not enough data",
      topCompany: text((company as Row | null)?.name) || "Not enough data",
      topLeadSource: rankedLabel(rank(leadRows.map((row) => text(row.source)))),
      monthlyRevenue: won.filter((row) => text(row.updated_at) >= month).reduce((sum, row) => sum + number(row.value), 0),
    };
  }
}
