import "server-only";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { integrationCenterRegistry } from "@/features/platform/integrations/center";
import { IntegrationService } from "@/features/platform/integrations/services/integration.service";
import type { IntegrationDashboardData } from "@/features/platform/integrations/types";
import { log } from "@/lib/observability/logger";
import type { EnterpriseIntegrationSnapshot, FounderProviderState } from "../types";

const supported = ["google_identity","gmail","google_calendar","whatsapp_business","openai","paddle","razorpay","crm_imports","transactional_email","microsoft_365","slack","dropbox","docusign","quickbooks","xero","youtube","tiktok","hubspot","salesforce","stripe"] as const;
const empty: IntegrationDashboardData = { providers: [], connections: [], webhooks: [], health: [], logs: [], retries: [], secrets: [] };

export class EnterpriseIntegrationService {
  async snapshot(): Promise<EnterpriseIntegrationSnapshot> {
    const started = performance.now(), { user } = await founderContext(), service = new IntegrationService();
    let dashboard = empty, syncHistory: readonly Record<string, unknown>[] = [], degradedReason: string | null = null;
    try { [dashboard, syncHistory] = await Promise.all([service.dashboard(), service.syncHistory()]); }
    catch (error) { degradedReason = "Workspace integration telemetry is unavailable. Provider adapters remain safely disconnected."; log("founder.integrations.telemetry_unavailable", { actorId: user.id, error: error instanceof Error ? error.message.slice(0, 240) : "Unknown integration telemetry error" }); }
    const providers = supported.map((code) => {
      const definition = integrationCenterRegistry.find((item) => item.code === code), persisted = dashboard.providers.find((item) => item.code === code), connection = dashboard.connections.find((item) => item.providerId === persisted?.id || item.providerCode === code), health = dashboard.health.find((item) => item.providerId === persisted?.id), webhook = dashboard.webhooks.find((item) => item.providerId === persisted?.id), future = ["slack","dropbox","docusign","quickbooks","xero","youtube","tiktok","hubspot","salesforce","stripe"].includes(code);
      const syncing = connection?.status === "connected" && dashboard.logs.some((item) => item.providerId === persisted?.id && /sync.*(start|running|progress)/i.test(item.event));
      const state: FounderProviderState = future ? "Coming Soon" : syncing ? "Syncing" : connection?.status === "connected" && health?.status === "healthy" ? "Connected" : connection?.status === "degraded" || connection?.status === "disabled" || (connection?.status === "connected" && health?.status && health.status !== "healthy") ? "Needs Attention" : "Not Connected";
      const reason = state === "Connected" ? "Live connection and health evidence are available." : state === "Syncing" ? "Synchronization activity is in progress." : state === "Needs Attention" ? `Connection health reported ${health?.status ?? connection?.status}.` : state === "Coming Soon" ? "This provider is planned for a future release." : degradedReason ?? "No active workspace connection was found.";
      return { code, name: definition?.name ?? persisted?.name ?? code.replaceAll("_", " "), version: persisted?.version ?? definition?.version ?? "1.0", category: definition?.category ?? persisted?.category ?? "future", state, reason, lastSync: connection?.lastSyncAt ?? health?.lastSuccessAt ?? null, latencyMs: health?.latencyMs ?? null, errorRate: health?.failureRate ?? null, webhookStatus: webhook?.status ?? "No events", tokenExpiration: null, featureFlag: definition?.featureFlag ?? null };
    });
    log("founder.integrations.viewed", { actorId: user.id, providers: providers.length, connected: providers.filter((item) => item.state === "Connected").length, latencyMs: Math.round(performance.now() - started) });
    return { providers, dashboard, syncHistory, generatedAt: new Date().toISOString(), dataAvailable: degradedReason === null, degradedReason };
  }
}
