import type { CreativeAssetOutput, CreativeRuntimeRequest } from "./types";
export interface CreativeProviderAdapter {
  readonly providerId: string;
  generate(
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  edit(
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  upscale(request: CreativeRuntimeRequest): Promise<CreativeAssetOutput>;
  removeBackground(
    request: CreativeRuntimeRequest,
  ): Promise<CreativeAssetOutput>;
  replaceBackground(
    request: CreativeRuntimeRequest,
  ): Promise<CreativeAssetOutput>;
  createVariations(
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  inpaint(request: CreativeRuntimeRequest): Promise<CreativeAssetOutput>;
  outpaint(request: CreativeRuntimeRequest): Promise<CreativeAssetOutput>;
  createLogo(
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
  createMockup(
    request: CreativeRuntimeRequest,
  ): Promise<readonly CreativeAssetOutput[]>;
}
export class CreativeAdapterRegistry {
  private readonly adapters = new Map<string, CreativeProviderAdapter>();
  get size() {
    return this.adapters.size;
  }
  get(providerId: string) {
    return this.adapters.get(providerId) ?? null;
  }
}
