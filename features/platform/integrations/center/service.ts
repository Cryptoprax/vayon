import "server-only";
import { EnvironmentFeatureFlagProvider, productionFeatureKeys } from "@/lib/infrastructure/feature-flags";
import { integrationContext } from "@/features/platform/integrations/services/integration-context";
import { GoogleRepository } from "@/features/platform/integrations/google/repositories/google.repository";
import { MicrosoftCookieCredentialVault } from "@/features/platform/integrations/microsoft/storage/cookie-credential.vault";
import { integrationCenterRegistry } from "./registry";
import type { IntegrationCenterItem, IntegrationCenterModel, IntegrationDisplayStatus, IntegrationHealth } from "./contracts";

type HealthRow = { provider_id: string; status: string; checked_at: string | null; last_success_at: string | null; last_failure_at: string | null; retry_count: number | null; integration_providers:{code:string}|null };
const displayStatus = (available: boolean, connected: boolean, health: IntegrationHealth, syncing: boolean): IntegrationDisplayStatus => !available ? "Coming Soon" : syncing ? "Syncing" : health === "needs_attention" || health === "authorization_required" ? "Needs Attention" : connected && health === "healthy" ? "Connected" : "Not Connected";

export class IntegrationCenterService {
  async model(): Promise<IntegrationCenterModel> {
    const ctx = await integrationContext();
    const flagProvider = new EnvironmentFeatureFlagProvider();
    const [google, microsoft, whatsapp, calendarConnection, healthResult, ...featureFlags] = await Promise.all([
      new GoogleRepository(ctx.client, ctx.organizationId, ctx.workspaceId).credential(),
      new MicrosoftCookieCredentialVault().load(ctx.workspaceId),
      ctx.client.from("whatsapp_connections").select("id,status").eq("workspace_id", ctx.workspaceId).eq("status", "connected").is("deleted_at", null).maybeSingle(),
      ctx.client.from("integration_connections").select("configuration,integration_providers!inner(code)").eq("workspace_id",ctx.workspaceId).eq("integration_providers.code","google_calendar").is("deleted_at",null).maybeSingle(),
      ctx.client.from("integration_health").select("provider_id,status,checked_at,last_success_at,last_failure_at,retry_count,integration_providers(code)").eq("organization_id", ctx.organizationId).eq("workspace_id", ctx.workspaceId),
      ...productionFeatureKeys.map((key) => flagProvider.evaluate(ctx.workspaceId, key)),
    ]);
    if (healthResult.error) throw healthResult.error;
    const healthRows = new Map(((healthResult.data ?? []) as unknown as HealthRow[]).map((row) => [row.integration_providers?.code ?? row.provider_id, row]));
    const items = integrationCenterRegistry.map((definition): IntegrationCenterItem => {
      const feature = definition.featureFlag ? featureFlags.find((flag) => flag.key === definition.featureFlag) : null;
      const featureEnabled = definition.featureFlag ? (feature?.enabled ?? false) : definition.available;
      const isGoogle = definition.code.startsWith("google_") || definition.code === "gmail";
      const isMicrosoft = ["microsoft_identity", "outlook", "microsoft_calendar", "onedrive", "microsoft_people", "teams", "microsoft_365"].includes(definition.code);
      const granted = isGoogle ? (google?.scopes ?? []) : isMicrosoft ? (microsoft?.scopes ?? []) : [];
      const configured = definition.code === "openai" ? Boolean(process.env.OPENAI_API_KEY) : definition.code === "paddle" ? Boolean(process.env.PADDLE_API_KEY) : definition.code === "transactional_email" ? Boolean(process.env.EMAIL_PROVIDER && process.env.EMAIL_FROM_ADDRESS) : false;
      const connected = definition.code === "google_identity" ? Boolean(google) : definition.code === "microsoft_identity" ? Boolean(microsoft) : definition.code === "whatsapp_business" ? Boolean(whatsapp.data) : isGoogle || isMicrosoft ? definition.requiredScopes.length > 0 && definition.requiredScopes.every((scope) => granted.includes(scope)) : configured;
      const missingScopes = definition.requiredScopes.filter((scope) => !granted.includes(scope));
      const expiresAt = isMicrosoft ? microsoft?.expiresAt : google?.expiresAt;
      const expired = Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
      const evidence = healthRows.get(definition.code) ?? healthRows.get(definition.code === "paddle" ? "billing" : definition.code === "transactional_email" ? "email" : definition.code);
      const syncing = evidence?.status === "syncing" || evidence?.status === "pending";
      const health: IntegrationHealth = !definition.available ? "unavailable" : !featureEnabled && definition.featureFlag ? "disabled" : connected && (expired || Boolean(evidence?.last_failure_at)) ? "needs_attention" : connected ? "healthy" : definition.requiredScopes.length && ((isGoogle && google) || (isMicrosoft && microsoft)) ? "authorization_required" : "unknown";
      const status = definition.code === "whatsapp_business" && !connected ? "Coming Soon" : displayStatus(definition.available, connected, health, syncing);
      return {
        definition, connected, featureEnabled, workspaceEnabled: featureEnabled,
        grantedScopes: definition.requiredScopes.filter((scope) => granted.includes(scope)), missingScopes, health, displayStatus: status,
        lastValidation: evidence?.checked_at ?? (isMicrosoft ? (microsoft?.validatedAt ?? null) : null), lastSync: evidence?.last_success_at ?? null,
        diagnostics: { lastError: evidence?.last_failure_at ? "A recent provider operation needs attention." : null, retryCount: evidence?.retry_count ?? null, quotaStatus: null, rateLimit: null, tokenExpiresAt: expiresAt ?? null },
        operational: {
          connectedEmail: isGoogle ? (google?.email ?? null) : isMicrosoft ? (microsoft?.email ?? null) : null,
          connectedAccount: isGoogle ? (google?.email ?? null) : isMicrosoft ? (microsoft?.displayName ?? microsoft?.email ?? null) : null,
          lastAuthentication: isGoogle ? (evidence?.checked_at ?? null) : isMicrosoft ? (microsoft?.validatedAt ?? null) : null,
          selectedCalendar: definition.code === "google_calendar" && connected ? String((calendarConnection.data?.configuration as {selectedCalendar?:string}|null)?.selectedCalendar ?? "Primary calendar") : null,
          configuredModel: definition.code === "openai" ? (process.env.OPENAI_MODEL ?? "gpt-5") : null,
          creditAvailability: definition.code === "openai" ? (["credit_balance_exhausted", "insufficient_quota"].includes(evidence?.status ?? "") ? "Credits unavailable" : "Not reported by provider") : null,
          recentRequestStatus: definition.code === "openai" ? (evidence?.last_failure_at ? "Needs Attention" : evidence?.last_success_at ? "Successful" : "No requests recorded") : null,
          environmentMode: definition.code === "paddle" ? (process.env.PADDLE_ENVIRONMENT === "sandbox" ? "Sandbox" : "Live") : null,
          webhookHealth: definition.code === "paddle" ? (evidence?.last_failure_at ? "Needs Attention" : evidence?.last_success_at ? "Connected" : "Not Connected") : null,
          portalHealth: definition.code === "paddle" ? (configured ? "Connected" : "Not Connected") : null,
          configuredProvider: definition.code === "transactional_email" ? (process.env.EMAIL_PROVIDER || null) : null,
          deliveryHealth: definition.code === "transactional_email" ? (evidence?.last_failure_at ? "Needs Attention" : evidence?.last_success_at ? "Connected" : "Not Connected") : null,
          lastSuccessfulSend: definition.code === "transactional_email" ? (evidence?.last_success_at ?? null) : null,
        },
      };
    });
    const count = (status: IntegrationDisplayStatus) => items.filter((item) => item.displayStatus === status).length;
    const systemHealth = { status: count("Needs Attention") ? "Needs Attention" as const : count("Syncing") ? "Syncing" as const : items.some((item) => item.displayStatus === "Connected") ? "Connected" as const : "Not Connected" as const, connected: count("Connected"), syncing: count("Syncing"), needsAttention: count("Needs Attention"), notConnected: count("Not Connected"), comingSoon: count("Coming Soon") };
    return Object.freeze({ workspaceId: ctx.workspaceId, providers: Object.freeze(items), featureFlags: Object.freeze(featureFlags), lifecycleEvents: Object.freeze([]), systemHealth: Object.freeze(systemHealth) });
  }
}
