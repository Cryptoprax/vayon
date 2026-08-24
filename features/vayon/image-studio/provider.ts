import type { AiEditOperation, ImageGenerationRequest } from "./types";
export interface ImageStudioProvider {
  readonly id: string;
  readonly connected: boolean;
  generate(request: ImageGenerationRequest): Promise<never>;
  edit(assetId: string, operation: AiEditOperation): Promise<never>;
}
export class UnavailableImageStudioProvider implements ImageStudioProvider {
  readonly id = "unavailable";
  readonly connected = false;
  async generate(_request: ImageGenerationRequest): Promise<never> {
    void _request;
    throw new Error("Image generation provider is not configured.");
  }
  async edit(_assetId: string, _operation: AiEditOperation): Promise<never> {
    void _assetId;
    void _operation;
    throw new Error("Image editing provider is not configured.");
  }
}
