import type {
  CreativeAssetOutput,
  CreativeRuntimeRequest,
} from "@/features/vayon/creative-runtime/types";
import type { ExecutionCapability } from "./types";
export interface RuntimeAdapterContext {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly correlationId: string;
  readonly timeoutMs: number;
  readonly signal: AbortSignal;
}
export interface RuntimeAdapterEstimate {
  readonly estimatedCost: number | null;
  readonly estimatedLatencyMs: number | null;
  readonly outputCount: number;
  readonly currency: string | null;
}
export interface RuntimeAdapterHealth {
  readonly state:
    "available" | "degraded" | "unavailable" | "maintenance" | "unknown";
  readonly checkedAt: string;
  readonly reason: string;
}
export interface RuntimeAdapter {
  readonly id: string;
  readonly capabilities: readonly ExecutionCapability[];
  generate(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  edit(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  translate(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  export(
    context: RuntimeAdapterContext,
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  validate(request: CreativeRuntimeRequest): Promise<readonly string[]>;
  health(): Promise<RuntimeAdapterHealth>;
  estimate(request: CreativeRuntimeRequest): Promise<RuntimeAdapterEstimate>;
}
export class RuntimeAdapterRegistry {
  private readonly adapters = new Map<string, RuntimeAdapter>();
  register(adapter: RuntimeAdapter) {
    if (this.adapters.has(adapter.id))
      throw new Error(`Runtime adapter ${adapter.id} is already registered.`);
    this.adapters.set(adapter.id, adapter);
  }
  get(id: string) {
    return this.adapters.get(id) ?? null;
  }
  forCapability(capability: ExecutionCapability) {
    return [...this.adapters.values()].filter((adapter) =>
      adapter.capabilities.includes(capability),
    );
  }
  list() {
    return [...this.adapters.values()];
  }
  get size() {
    return this.adapters.size;
  }
}
