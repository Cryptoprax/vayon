import type { FounderKpi, PlatformMetricRow } from "@/features/platform/founder/types";

export interface SalesTimelineItem { readonly id: string; readonly category: string; readonly title: string; readonly detail: string | null; readonly occurredAt: string; }
export interface SalesAutomation { readonly id: string; readonly name: string; readonly trigger: string; readonly consentRequired: true; readonly approvalRequired: true; }
export interface SalesDirectorSnapshot { readonly kpis: readonly FounderKpi[]; readonly metrics: readonly PlatformMetricRow[]; readonly timeline: readonly SalesTimelineItem[]; readonly automations: readonly SalesAutomation[]; readonly reports: readonly { id: string; label: string; formats: readonly ["PDF", "PowerPoint"] }[]; readonly generatedAt: string; }
