import "server-only";
import { operationsContext } from "@/features/vayon/operations/services/context";
import { PerformanceCacheService } from "@/features/platform/performance/services/cache.service";
import { OpenAIWorkforceService } from "@/features/platform/openai/services/openai-workforce.service";
import { SupabaseContinuousLearningRepository } from "../repositories/continuous-learning.repository";
import type { ExecutiveBriefing } from "../contracts";

export class ContinuousLearningService {
  private cache = new PerformanceCacheService();
  private async context() {
    const context = await operationsContext();
    const { data } = await context.client.auth.getUser();
    if (!data.user) throw new Error("Authenticated user required.");
    return {
      ...context,
      userId: data.user.id,
      repository: new SupabaseContinuousLearningRepository(
        context.client,
        context.organizationId,
        context.workspaceId,
      ),
    };
  }
  async snapshot() {
    const context = await this.context();
    return this.cache.remember(
      context.organizationId,
      context.workspaceId,
      `continuous-learning:${context.userId}`,
      () => context.repository.snapshot(context.userId),
      {
        ttlMs: Number(process.env.CONTINUOUS_LEARNING_CACHE_TTL_MS ?? 300000),
        tags: [`continuous-learning:${context.workspaceId}`],
      },
    );
  }
  async remember(
    scope: "organization" | "user",
    key: string,
    value: readonly string[],
  ) {
    const context = await this.context();
    await context.repository.remember(scope, key, value);
    await this.cache.invalidate([`continuous-learning:${context.workspaceId}`]);
  }
  async generateBriefing(period: ExecutiveBriefing["period"]) {
    const context = await this.context();
    const evidence = await context.repository.snapshot(context.userId);
    const facts = Object.fromEntries([
      ...evidence.executiveMetrics.map((item) => [item.id, item.value]),
      ...evidence.qualityMetrics.map((item) => [
        `quality_${item.id}`,
        item.value,
      ]),
      ["repeated_question_topics", evidence.repeatedQuestions.length],
      ["unused_capabilities", evidence.unusedCapabilities.length],
      ["recommendations", evidence.recommendations.length],
    ]);
    const result = await new OpenAIWorkforceService().summarize(
      "executive-ai",
      {
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        subjectType: "product_intelligence",
        facts: { period, ...facts },
      },
    );
    const input = {
      period,
      summary: result.result.text,
      source: result.result.source,
      model:
        result.provider === "openai"
          ? (process.env.OPENAI_MODEL ?? "gpt-5")
          : null,
      aiGenerated: result.provider === "openai",
      recommendationOnly: true as const,
    };
    await context.repository.saveBriefing(input);
    await this.cache.invalidate([`continuous-learning:${context.workspaceId}`]);
    return input;
  }
}
