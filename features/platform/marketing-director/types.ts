import type { FounderKpi, PlatformMetricRow } from "@/features/platform/founder/types";

export type CampaignState = "draft" | "scheduled" | "running" | "paused" | "completed";
export interface MarketingCampaign { readonly id: string; readonly name: string; readonly channel: string; readonly state: CampaignState; readonly updatedAt: string; }
export interface AttributionRow { readonly source: string; readonly visitors: number | null; readonly leads: number | null; readonly trials: number | null; readonly paidCustomers: number | null; readonly revenue: number | null; readonly cac: number | null; readonly roas: number | null; }
export interface AutomationTemplate { readonly id: string; readonly name: string; readonly trigger: string; readonly consentRequired: true; readonly unsubscribeRequired: true; readonly approvalRequired: true; }
export interface MarketingDirectorSnapshot { readonly kpis: readonly FounderKpi[]; readonly campaigns: readonly MarketingCampaign[]; readonly attribution: readonly AttributionRow[]; readonly automations: readonly AutomationTemplate[]; readonly reports: readonly { id: string; label: string; formats: readonly ["PDF", "PowerPoint"] }[]; readonly metrics: readonly PlatformMetricRow[]; readonly generatedAt: string; }
