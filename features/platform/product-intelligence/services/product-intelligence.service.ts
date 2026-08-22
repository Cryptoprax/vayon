import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { PerformanceCacheService } from "@/features/platform/performance/services/cache.service";
import { SupabaseProductIntelligenceRepository } from "../repositories/product-intelligence.repository";
import type { ProductEvent, ProductFeedbackInput } from "../contracts";
import type { ProductTelemetryPublisher } from "@/features/platform/event-bus/domain/event";
export class ProductIntelligenceService implements ProductTelemetryPublisher {
  private cache = new PerformanceCacheService();
  private async context() {
    const c = await operationsContext();
    return {
      ...c,
      repository: new SupabaseProductIntelligenceRepository(
        c.client,
        c.organizationId,
        c.workspaceId,
      ),
    };
  }
  async recordBatch(events: readonly ProductEvent[]) {
    const c = await this.context();
    await c.repository.recordBatch(events);
    await this.cache.invalidate([`product-intelligence:${c.workspaceId}`]);
  }
  async feedback(input: ProductFeedbackInput, screenshot?: File) {
    const c = await this.context(),
      screenshotPath =
        screenshot && screenshot.size
          ? await c.repository.uploadScreenshot(screenshot)
          : undefined;
    await c.repository.submitFeedback({
      ...input,
      ...(screenshotPath ? { screenshotPath } : {}),
    });
    await this.cache.invalidate([`product-intelligence:${c.workspaceId}`]);
  }
  async snapshot() {
    const c = await this.context();
    return this.cache.remember(
      c.organizationId,
      c.workspaceId,
      "product-intelligence:snapshot",
      () => c.repository.snapshot(),
      {
        ttlMs: Number(process.env.PRODUCT_INTELLIGENCE_CACHE_TTL_MS ?? 60000),
        tags: [`product-intelligence:${c.workspaceId}`],
      },
    );
  }
}
