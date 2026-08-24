import "server-only";

import { founderContext } from "@/features/platform/founder/services/founder-context";
import type { FounderKpi, PlatformMetricRow } from "@/features/platform/founder/types";
import { log } from "@/lib/observability/logger";
import { SalesDirectorRepository } from "../repositories/sales-director.repository";
import type { SalesDirectorSnapshot } from "../types";

const automations = [["call", "Call reminders", "Follow-up due"], ["email", "Email reminders", "Response overdue"], ["proposal", "Proposal reminders", "Proposal awaiting response"], ["site-visit", "Site visit reminders", "Visit approaching"], ["renewal", "Renewal reminders", "Renewal approaching"]].map(([id, name, trigger]) => ({ id: id!, name: name!, trigger: trigger!, consentRequired: true as const, approvalRequired: true as const }));
export class SalesDirectorService {
  async snapshot(): Promise<SalesDirectorSnapshot> {
    const started = performance.now(), { client, user } = await founderContext(), repository = new SalesDirectorRepository(client);
    const [metrics, activeSiteVisits, timelineRows] = await Promise.all([repository.metrics().catch(() => []), repository.count("site_visits", { status: "scheduled" }).catch(() => null), repository.timeline().catch(() => [])]);
    const latest = new Map<string, PlatformMetricRow>(); for (const row of metrics) if (!latest.has(row.metric)) latest.set(row.metric, row);
    const value = (...keys: readonly string[]) => { for (const key of keys) { const candidate = latest.get(key)?.value; if (candidate !== undefined && Number.isFinite(candidate)) return candidate; } return null; };
    const kpis: FounderKpi[] = [metric("today-revenue", "Today's Revenue", value("today_revenue", "sales_today_revenue"), "currency"), metric("monthly-revenue", "Monthly Revenue", value("monthly_revenue", "sales_monthly_revenue"), "currency"), metric("forecast-revenue", "Forecast Revenue", value("forecast_revenue", "sales_forecast"), "currency"), metric("pipeline-value", "Pipeline Value", value("pipeline_value"), "currency"), metric("new-leads", "New Leads", value("new_leads"), "count"), metric("qualified-leads", "Qualified Leads", value("qualified_leads"), "count"), metric("won-deals", "Won Deals", value("won_deals"), "count"), metric("lost-deals", "Lost Deals", value("lost_deals"), "count"), metric("site-visits", "Active Site Visits", activeSiteVisits, "count"), metric("average-deal", "Average Deal Size", value("average_deal", "average_deal_value"), "currency"), metric("conversion", "Conversion Rate", value("conversion_rate", "sales_conversion"), "percent"), metric("velocity", "Sales Velocity", value("sales_velocity"), "ratio")];
    const timeline = timelineRows.map((row) => ({ id: String(row.id), category: String(row.event_type ?? "activity"), title: String(row.title ?? "Sales activity"), detail: row.description == null ? null : String(row.description).slice(0, 500), occurredAt: String(row.occurred_at) }));
    log("founder.sales_director.viewed", { actorId: user.id, unavailableMetrics: kpis.filter((item) => item.status === "unavailable").length, latencyMs: Math.round(performance.now() - started) });
    return { kpis, metrics, timeline, automations, reports: ["Daily Sales Report", "Weekly Sales Report", "Monthly Sales Report"].map((label) => ({ id: label.toLowerCase().replaceAll(" ", "-"), label, formats: ["PDF", "PowerPoint"] as const })), generatedAt: new Date().toISOString() };
  }
}
function metric(id: string, label: string, value: number | null, unit: string): FounderKpi { return { id, label, value, unit, status: value === null ? "unavailable" : "measured" }; }
