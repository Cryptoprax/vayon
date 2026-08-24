import type { IntegrationDashboardData } from "@/features/platform/integrations/types";

export type FounderProviderState = "Healthy" | "Warning" | "Disconnected" | "Error" | "Disabled";
export interface FounderProviderView { code: string; name: string; version: string; category: string; state: FounderProviderState; reason: string; lastSync: string | null; latencyMs: number | null; errorRate: number | null; webhookStatus: string; tokenExpiration: string | null; featureFlag: string | null }
export interface EnterpriseIntegrationSnapshot { providers: readonly FounderProviderView[]; dashboard: IntegrationDashboardData; syncHistory: readonly Record<string, unknown>[]; generatedAt: string; dataAvailable: boolean; degradedReason: string | null }
