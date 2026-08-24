import "server-only";
import { founderContext } from "@/features/platform/founder/services/founder-context";
import { CreativeAdapterRegistry } from "./adapter";
import { buildCapabilityMatrix } from "./capabilities";
import { CreativeProviderRegistry } from "./registry";
import type { CreativeRuntimeSnapshot } from "./types";
export class CreativeRuntimeService {
  async snapshot(): Promise<CreativeRuntimeSnapshot> {
    await founderContext();
    const providers = new CreativeProviderRegistry().list(),
      adapters = new CreativeAdapterRegistry();
    return {
      providers,
      capabilities: buildCapabilityMatrix(providers),
      health: "Unavailable",
      routingDecisions: [],
      jobs: [],
      registeredAdapters: adapters.size as 0,
      liveProviders: 0,
      generatedAt: new Date().toISOString(),
    };
  }
}
