import type { CreativeRuntimeRequest } from "@/features/vayon/creative-runtime/types";
import { RuntimeAdapterRegistry } from "./adapter";
import type { ExecutionCapability, ExecutionPlan } from "./types";
export class CreativeExecutionPlanner {
  constructor(private registry: RuntimeAdapterRegistry) {}
  async plan(
    jobId: string,
    capability: ExecutionCapability,
    request: CreativeRuntimeRequest,
    dependencies: readonly string[] = [],
  ): Promise<ExecutionPlan> {
    const candidates = this.registry.forCapability(capability),
      healthy = [] as string[],
      reasons = [] as string[];
    for (const adapter of candidates) {
      const validation = await adapter.validate(request);
      if (validation.length) {
        reasons.push(...validation.map((reason) => `${adapter.id}: ${reason}`));
        continue;
      }
      const health = await adapter.health();
      if (health.state === "available") healthy.push(adapter.id);
      else reasons.push(`${adapter.id}: ${health.reason}`);
    }
    const uniqueDependencies = [...new Set(dependencies)],
      validDependencies = uniqueDependencies.every(
        (value) => value.trim().length > 0,
      ),
      selected = healthy[0] ?? null;
    if (!validDependencies)
      reasons.push("Execution dependencies contain invalid identifiers.");
    if (!selected)
      reasons.push("No available adapter provides the required capability.");
    return {
      jobId,
      capability,
      providerIds: healthy,
      selectedProviderId: selected,
      fallbackProviderIds: healthy.slice(1),
      dependencies: uniqueDependencies,
      executionOrder: [...uniqueDependencies, jobId],
      valid: Boolean(selected && validDependencies),
      reasons,
    };
  }
}
