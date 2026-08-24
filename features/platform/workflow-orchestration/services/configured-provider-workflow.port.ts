import { IntegrationProviderRegistry } from "@/features/platform/integrations/provider/registry";
export interface ProviderWorkflowCall { readonly providerCode: string; readonly operation: "connection_test" | "manual_sync" }
export class ConfiguredProviderWorkflowPort {
  constructor(private readonly registry = new IntegrationProviderRegistry()) {}
  async call(request: ProviderWorkflowCall) {
    const provider = this.registry.resolve(request.providerCode), health = await provider.testConnection();
    if (health.status !== "healthy") return { status: "unavailable" as const, provider: provider.code, reason: String(health.details?.reason ?? "Provider is disconnected.") };
    if (request.operation === "connection_test") return { status: "completed" as const, provider: provider.code, latencyMs: health.latencyMs ?? null };
    const result = await provider.sync({ mode: "manual" });
    return { ...result, provider: provider.code };
  }
}
