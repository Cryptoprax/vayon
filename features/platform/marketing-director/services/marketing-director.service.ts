import "server-only";

import { founderContext } from "@/features/platform/founder/services/founder-context";
import type { FounderKpi, PlatformMetricRow } from "@/features/platform/founder/types";
import { log } from "@/lib/observability/logger";
import { MarketingDirectorRepository } from "../repositories/marketing-director.repository";
import type { AttributionRow, CampaignState, MarketingCampaign, MarketingDirectorSnapshot } from "../types";

const sources = ["Google Ads", "Meta", "LinkedIn", "Organic", "Direct", "Referral", "Email", "Affiliate"] as const;
const validStates = new Set<CampaignState>(["draft", "scheduled", "running", "paused", "completed"]);
const automations = [
  ["welcome", "Welcome emails", "Consent-confirmed signup"], ["trial-onboarding", "Trial onboarding", "Trial started"], ["trial-reminder", "Trial reminders", "Trial ending"], ["renewal", "Renewal reminders", "Renewal approaching"], ["win-back", "Win-back campaigns", "Consent-valid inactive customer"],
].map(([id, name, trigger]) => ({ id: id!, name: name!, trigger: trigger!, consentRequired: true as const, unsubscribeRequired: true as const, approvalRequired: true as const }));

export class MarketingDirectorService {
  async snapshot(): Promise<MarketingDirectorSnapshot> {
    const started = performance.now(), { client, user } = await founderContext(), repository = new MarketingDirectorRepository(client);
    const [metrics, campaignRows, attributionEvidence] = await Promise.all([repository.metrics().catch(() => []), repository.campaigns().catch(() => []), repository.attribution().catch(() => ({ events: [], leads: [] }))]);
    const latest = new Map<string, PlatformMetricRow>(); for (const row of metrics) if (!latest.has(row.metric)) latest.set(row.metric, row);
    const value = (...keys: readonly string[]) => { for (const key of keys) { const candidate = latest.get(key)?.value; if (candidate !== undefined && Number.isFinite(candidate)) return candidate; } return null; };
    const kpis = [metric("spend", "Marketing Spend", value("marketing_spend", "ad_spend"), "currency"), metric("revenue", "Revenue", value("marketing_revenue", "attributed_revenue"), "currency"), metric("roi", "ROI", value("marketing_roi", "roi"), "percent"), metric("roas", "ROAS", value("marketing_roas", "roas"), "ratio"), metric("cac", "CAC", value("marketing_cac", "cac"), "currency"), metric("cpl", "CPL", value("marketing_cpl", "cpl"), "currency"), metric("trial-conversion", "Trial Conversion", value("trial_conversion"), "percent"), metric("paid-conversion", "Paid Conversion", value("paid_conversion", "paid_conversion_rate"), "percent"), metric("monthly-growth", "Monthly Growth", value("monthly_growth"), "percent"), metric("daily-growth", "Daily Growth", value("daily_growth"), "percent")];
    const campaigns = campaignRows.map(toCampaign);
    const attribution = sources.map((source): AttributionRow => attributionRow(source, attributionEvidence.events, attributionEvidence.leads, latest));
    log("founder.marketing_director.viewed", { actorId: user.id, campaigns: campaigns.length, unavailableMetrics: kpis.filter((item) => item.status === "unavailable").length, latencyMs: Math.round(performance.now() - started) });
    return { kpis, campaigns, attribution, automations, reports: ["Daily report", "Weekly report", "Monthly report"].map((label) => ({ id: label.toLowerCase().replaceAll(" ", "-"), label, formats: ["PDF", "PowerPoint"] as const })), metrics, generatedAt: new Date().toISOString() };
  }
}

function metric(id: string, label: string, value: number | null, unit: string): FounderKpi { return { id, label, value, unit, status: value === null ? "unavailable" : "measured" }; }
function toCampaign(row: Record<string, unknown>): MarketingCampaign { const raw = String(row.status ?? "draft").toLowerCase().replaceAll(" ", "_") as CampaignState, state = validStates.has(raw) ? raw : "draft", platforms = Array.isArray(row.platforms) ? row.platforms.map(String).join(", ") : String(row.platforms ?? "Unassigned"); return { id: String(row.id), name: String(row.name ?? "Untitled campaign"), channel: platforms, state, updatedAt: String(row.updated_at ?? row.created_at ?? new Date(0).toISOString()) }; }
function attributionRow(source: string, events: readonly Record<string, unknown>[], leads: readonly Record<string, unknown>[], metrics: ReadonlyMap<string, PlatformMetricRow>): AttributionRow { const slug = source.toLowerCase().replaceAll(" ", "_"); const sourceOf = (row: Record<string, unknown>) => String(row.source ?? (row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>).source : "") ?? "").toLowerCase().replaceAll(" ", "_"); const matchingEvents = events.filter((row) => sourceOf(row) === slug), matchingLeads = leads.filter((row) => sourceOf(row) === slug); const measured = (name: string) => metrics.get(`marketing_${slug}_${name}`)?.value ?? null, visitors = measured("visitors") ?? (matchingEvents.length ? matchingEvents.filter((row) => row.event_type === "page_view").length : null), leadCount = measured("leads") ?? (matchingLeads.length || matchingEvents.length ? matchingLeads.length : null), trials = measured("trials") ?? (matchingLeads.length ? matchingLeads.filter((row) => row.kind === "trial").length : null), paidCustomers = measured("paid_customers"), revenue = measured("revenue"), spend = measured("spend"); return { source, visitors, leads: leadCount, trials, paidCustomers, revenue, cac: spend !== null && paidCustomers ? spend / paidCustomers : null, roas: spend && revenue !== null ? revenue / spend : null }; }
