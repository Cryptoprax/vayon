import type { ExecutiveDashboardData } from "@/features/vayon/dashboard/types";

export type DemoCollection =
  "properties" | "leads" | "deals" | "communications" | "activity";
export type DemoMode =
  "visitor" | "sales" | "investor" | "founder" | "enterprise";
export interface DemoModeProfile {
  readonly id: DemoMode;
  readonly label: string;
  readonly audience: string;
  readonly openingTab: string;
  readonly highlights: readonly string[];
}
export interface DemoRecord {
  readonly id: string;
  readonly kind: DemoCollection;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly meta: readonly string[];
  readonly image?: string;
  readonly occurredAt?: string;
  readonly monetaryRangeUsd?: Readonly<{ minimum?: number; maximum?: number }>;
}
export interface DemoInventory {
  readonly organization: "Prime Properties Realty";
  readonly persistence: "seeded-json-fixtures";
  readonly readOnly: true;
  readonly properties: readonly DemoRecord[];
  readonly leads: readonly DemoRecord[];
  readonly deals: readonly DemoRecord[];
  readonly communications: readonly DemoRecord[];
  readonly activity: readonly DemoRecord[];
}
export interface DemoExperienceModel {
  readonly dashboard: ExecutiveDashboardData;
  readonly inventory: DemoInventory;
  readonly counts: {
    readonly users: number;
    readonly properties: number;
    readonly leads: number;
    readonly deals: number;
    readonly whatsapp: number;
    readonly activity: number;
  };
  readonly enterprise: DemoEnterpriseProjection;
}
export interface DemoRepository {
  load(): DemoInventory;
}

export interface DemoEnterpriseItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly status: string;
  readonly relatedIds: readonly string[];
  readonly monetaryValueUsd?: number;
}
export interface DemoEnterpriseProjection {
  readonly datasetVersion: "prime-properties-v1";
  readonly demoData: true;
  readonly team: readonly DemoEnterpriseItem[];
  readonly workflows: readonly DemoEnterpriseItem[];
  readonly aiRecommendations: readonly DemoEnterpriseItem[];
  readonly notifications: readonly DemoEnterpriseItem[];
  readonly billing: readonly DemoEnterpriseItem[];
  readonly analytics: readonly DemoEnterpriseItem[];
  readonly campaigns: readonly DemoEnterpriseItem[];
  readonly subscriptions: readonly DemoEnterpriseItem[];
  readonly knowledge: readonly DemoEnterpriseItem[];
  readonly creative: readonly DemoEnterpriseItem[];
  readonly customerSuccess: readonly DemoEnterpriseItem[];
  readonly reports: readonly DemoEnterpriseItem[];
  readonly aiDemonstrations: readonly DemoEnterpriseItem[];
  readonly aiEmployees: readonly DemoEnterpriseItem[];
  readonly calendar: readonly DemoEnterpriseItem[];
  readonly tasks: readonly DemoEnterpriseItem[];
  readonly communications: readonly DemoEnterpriseItem[];
  readonly marketingAssets: readonly DemoEnterpriseItem[];
  readonly executiveDashboard: readonly DemoEnterpriseItem[];
  readonly founderDashboard: readonly DemoEnterpriseItem[];
  readonly investor: readonly DemoEnterpriseItem[];
  readonly executiveStory: readonly DemoEnterpriseItem[];
  readonly modes: readonly DemoModeProfile[];
  readonly tour: readonly DemoEnterpriseItem[];
}
