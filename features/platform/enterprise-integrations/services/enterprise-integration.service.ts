import "server-only";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { integrationCenterRegistry } from "@/features/platform/integrations/center";
import { IntegrationProviderRegistry } from "@/features/platform/integrations/provider/registry";
import { IntegrationService } from "@/features/platform/integrations/services/integration.service";
import type { IntegrationDashboardData } from "@/features/platform/integrations/types";
import { log } from "@/lib/observability/logger";
import type { EnterpriseIntegrationSnapshot, FounderProviderState } from "../types";

const supported = ["google_ads","google_analytics_4","google_search_console","google_business_profile","meta_ads","linkedin_ads","stripe","razorpay","google_calendar","microsoft_365","outlook_calendar","gmail","microsoft_graph","whatsapp_business","twilio","resend","sendgrid","zoom","microsoft_teams","openai","anthropic"] as const;
const empty: IntegrationDashboardData = { providers: [], connections: [], webhooks: [], health: [], logs: [], retries: [], secrets: [] };

export class EnterpriseIntegrationService {
  async snapshot(): Promise<EnterpriseIntegrationSnapshot> {
    const started = performance.now(), { user } = await founderContext(), service = new IntegrationService(), registry = new IntegrationProviderRegistry();
    let dashboard = empty, syncHistory: readonly Record<string, unknown>[] = [], degradedReason: string | null = null;
    try { [dashboard, syncHistory] = await Promise.all([service.dashboard(), service.syncHistory()]); }
    catch (error) { degradedReason = "Workspace integration telemetry is unavailable. Provider adapters remain safely disconnected."; log("founder.integrations.telemetry_unavailable", { actorId: user.id, error: error instanceof Error ? error.message.slice(0, 240) : "Unknown integration telemetry error" }); }
    const providers = await Promise.all(supported.map(async (code) => {
      const definition = integrationCenterRegistry.find((item) => item.code === code), adapter = registry.resolve(code), persisted = dashboard.providers.find((item) => item.code === code), connection = dashboard.connections.find((item) => item.providerId === persisted?.id || item.providerCode === code), health = dashboard.health.find((item) => item.providerId === persisted?.id), webhook = dashboard.webhooks.find((item) => item.providerId === persisted?.id), result = await adapter.health();
      const state: FounderProviderState = connection?.status === "disabled" ? "Disabled" : health?.status === "healthy" && connection?.status === "connected" ? "Healthy" : health?.status === "unavailable" || connection?.status === "degraded" ? "Error" : result.status === "degraded" ? "Warning" : "Disconnected";
      return { code, name: definition?.name ?? persisted?.name ?? code, version: persisted?.version ?? adapter.version, category: definition?.category ?? persisted?.category ?? "future", state, reason: health?.status === "healthy" ? "Live provider health is healthy." : String(result.details?.reason ?? degradedReason ?? "Credentials are not configured for this workspace."), lastSync: connection?.lastSyncAt ?? null, latencyMs: health?.latencyMs ?? result.latencyMs ?? null, errorRate: health?.failureRate ?? null, webhookStatus: webhook?.status ?? "No events", tokenExpiration: null, featureFlag: definition?.featureFlag ?? null };
    }));
    log("founder.integrations.viewed", { actorId: user.id, providers: providers.length, connected: providers.filter((item) => item.state === "Healthy").length, latencyMs: Math.round(performance.now() - started) });
    return { providers, dashboard, syncHistory, generatedAt: new Date().toISOString(), dataAvailable: degradedReason === null, degradedReason };
  }
}
