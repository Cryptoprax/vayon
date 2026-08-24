import { CreativeProviderRegistry } from "./registry";
import type { CreativeRuntimeRequest, RoutingDecision } from "./types";
const priority = { high: 0, normal: 1, low: 2 } as const;
export class CreativeProviderRouter {
  constructor(private registry = new CreativeProviderRegistry()) {}
  route(request: CreativeRuntimeRequest): RoutingDecision {
    const candidates = this.registry
        .forCapability(request.requiredCapability)
        .filter(
          (provider) =>
            provider.supportedAspectRatios.includes(request.aspectRatio) &&
            (!provider.maxResolution || provider.maxResolution.length > 0),
        )
        .sort(
          (a, b) =>
            priority[request.priority] - priority[request.priority] ||
            a.qualityTier.localeCompare(b.qualityTier) ||
            a.speedTier.localeCompare(b.speedTier) ||
            a.costTier.localeCompare(b.costTier) ||
            a.id.localeCompare(b.id),
        ),
      chain = candidates.map((item) => item.id),
      selected = candidates[0] ?? null;
    return {
      requestId: request.id,
      state: selected ? "routed" : "unavailable",
      selectedProviderId: selected?.id ?? null,
      fallbackChain: chain,
      reasons: selected
        ? [
            `Selected by required capability ${request.requiredCapability}, aspect ratio, quality, speed, cost, and priority.`,
          ]
        : [
            "No available provider satisfies the required capability and output constraints.",
            "Creative runtime failed closed; no job or asset was created.",
          ],
      evaluatedAt: new Date().toISOString(),
    };
  }
}
