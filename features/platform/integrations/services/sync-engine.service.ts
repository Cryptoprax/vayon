import type { IntegrationAuditSink, IntegrationProvider, IntegrationSyncRequest, IntegrationSyncResult, ProviderOperation, ProviderRateLimiter, ProviderStructuredError } from "../provider/contracts";

export interface IntegrationRetrySink { enqueue(input: { provider: string; operation: ProviderOperation; error: ProviderStructuredError }): Promise<void> }
export interface IntegrationSyncEngineDependencies { rateLimiter: ProviderRateLimiter; audit: IntegrationAuditSink; retries: IntegrationRetrySink }

export class IntegrationSyncEngine {
  constructor(private readonly dependencies: IntegrationSyncEngineDependencies) {}
  async run(provider: IntegrationProvider, request: IntegrationSyncRequest): Promise<IntegrationSyncResult> {
    const operation = `${request.mode}_sync` as ProviderOperation;
    const started = performance.now();
    const limit = await this.dependencies.rateLimiter.acquire(provider.code, operation);
    if (!limit.allowed) return this.fail(provider.code, operation, started, { provider: provider.code, operation, code: "rate_limited", category: "rate_limit", retryable: true, sanitizedMessage: `Provider rate limit reached. Retry after ${limit.retryAfterMs ?? 0} ms.` });
    try {
      const result = await provider.sync(request);
      await this.dependencies.audit.record({ provider: provider.code, operation, status: result.status, latencyMs: Math.round(performance.now() - started) });
      return result;
    } catch (cause) {
      const error: ProviderStructuredError = { provider: provider.code, operation, code: "provider_exception", category: "provider", retryable: true, sanitizedMessage: cause instanceof Error ? cause.message.slice(0, 240) : "Provider operation failed." };
      return this.fail(provider.code, operation, started, error);
    }
  }
  private async fail(provider: string, operation: ProviderOperation, started: number, error: ProviderStructuredError): Promise<IntegrationSyncResult> {
    const latencyMs = Math.round(performance.now() - started);
    await this.dependencies.audit.record({ provider, operation, status: "failed", latencyMs, error });
    if (error.retryable) await this.dependencies.retries.enqueue({ provider, operation, error });
    return { status: "failed", processed: 0, conflicts: 0, retryable: error.retryable };
  }
}
