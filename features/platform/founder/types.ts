export type MetricValue = number | null;

export interface FounderKpi {
  readonly id: string;
  readonly label: string;
  readonly value: MetricValue;
  readonly unit: string;
  readonly status: "measured" | "unavailable";
}

export interface FounderTrendPoint {
  readonly label: string;
  readonly value: number;
}

export interface FounderChart {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly points: readonly FounderTrendPoint[];
}

export interface FounderActivity {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly occurredAt: string;
}

export interface FounderMarketingChannel {
  readonly channel: string;
  readonly spend: MetricValue;
  readonly revenue: MetricValue;
  readonly roas: MetricValue;
  readonly roi: MetricValue;
  readonly clicks: MetricValue;
  readonly ctr: MetricValue;
  readonly conversions: MetricValue;
  readonly costPerLead: MetricValue;
  readonly costPerCustomer: MetricValue;
}

export interface FounderHealthItem {
  readonly name: string;
  readonly state: "healthy" | "degraded" | "unavailable";
  readonly value: string;
}

export interface FounderInsight {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly severity: "critical" | "high" | "medium" | "low";
  readonly recommendationOnly: true;
}

export interface FounderSnapshot {
  readonly kpis: readonly FounderKpi[];
  readonly activity: readonly FounderActivity[];
  readonly charts: readonly FounderChart[];
  readonly marketing: readonly FounderMarketingChannel[];
  readonly sales: readonly FounderKpi[];
  readonly health: readonly FounderHealthItem[];
  readonly security: readonly FounderKpi[];
  readonly insights: readonly FounderInsight[];
  readonly generatedAt: string;
}

export interface PlatformMetricRow {
  readonly id: string;
  readonly metric: string;
  readonly value: number;
  readonly unit: string;
  readonly recordedAt: string;
}
