import "server-only";
import OpenAI, { toFile } from "openai";
import { classifyOpenAIHealthError } from "@/features/platform/openai/providers/openai.provider";
export interface CreativeImageRequest {
  readonly prompt: string;
  readonly size: "1024x1024" | "1024x1536" | "1536x1024";
  readonly quality: "low" | "medium" | "high";
  readonly workspaceId: string;
}
export interface CreativeImageResult {
  readonly bytes: Uint8Array;
  readonly mimeType: "image/png";
  readonly model: string;
  readonly revisedPrompt?: string;
  readonly latencyMs: number;
}
export interface CreativeImageEditRequest extends CreativeImageRequest {
  readonly image: Uint8Array;
}
type ImageClient = Pick<OpenAI, "images" | "moderations">;
export class OpenAICreativeImageProvider {
  readonly version = "openai-image-1.0";
  constructor(private api?: ImageClient) {}
  async generate(input: CreativeImageRequest): Promise<CreativeImageResult> {
    if (!input.workspaceId)
      throw new Error("Workspace attribution is required.");
    if (!input.prompt.trim() || input.prompt.length > 12000)
      throw new Error("Creative prompt must contain 1–12000 characters.");
    const api =
        this.api ??
        new OpenAI({
          apiKey: configured(),
          maxRetries: 2,
          timeout: Number(process.env.OPENAI_IMAGE_TIMEOUT_MS ?? 120000),
        }),
      moderation = await api.moderations.create({
        model: "omni-moderation-latest",
        input: input.prompt,
      });
    if (moderation.results[0]?.flagged)
      throw new Error("Creative prompt was blocked by content safety policy.");
    const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
      started = performance.now();
    try {
      const result = await api.images.generate({
        model,
        prompt: input.prompt,
        size: input.size,
        quality: input.quality,
        output_format: "png",
        n: 1,
      });
      const image = result.data?.[0],
        encoded = image?.b64_json;
      if (!encoded) throw new Error("Image provider returned no asset data.");
      return {
        bytes: Uint8Array.from(Buffer.from(encoded, "base64")),
        mimeType: "image/png",
        model,
        revisedPrompt: image.revised_prompt ?? undefined,
        latencyMs: Math.round(performance.now() - started),
      };
    } catch (reason) {
      throw new CreativeGenerationProviderError(
        classifyOpenAIHealthError(reason),
      );
    }
  }
  async edit(input: CreativeImageEditRequest): Promise<CreativeImageResult> {
    if (!input.workspaceId || !input.image.length)
      throw new Error("Workspace attribution and source image are required.");
    if (!input.prompt.trim() || input.prompt.length > 12000)
      throw new Error("Creative edit prompt must contain 1–12000 characters.");
    const api =
        this.api ??
        new OpenAI({
          apiKey: configured(),
          maxRetries: 2,
          timeout: Number(process.env.OPENAI_IMAGE_TIMEOUT_MS ?? 120000),
        }),
      moderation = await api.moderations.create({
        model: "omni-moderation-latest",
        input: input.prompt,
      });
    if (moderation.results[0]?.flagged)
      throw new Error("Creative prompt was blocked by content safety policy.");
    const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2",
      started = performance.now();
    try {
      const result = await api.images.edit({
          model,
          image: await toFile(input.image, "source.png", { type: "image/png" }),
          prompt: input.prompt,
          size: input.size,
          quality: input.quality,
          output_format: "png",
          n: 1,
        }),
        encoded = result.data?.[0]?.b64_json;
      if (!encoded)
        throw new Error("Image provider returned no edited asset data.");
      return {
        bytes: Uint8Array.from(Buffer.from(encoded, "base64")),
        mimeType: "image/png",
        model,
        latencyMs: Math.round(performance.now() - started),
      };
    } catch (reason) {
      throw new CreativeGenerationProviderError(
        classifyOpenAIHealthError(reason),
      );
    }
  }
}
export class CreativeGenerationProviderError extends Error {
  constructor(readonly diagnostic: string) {
    super(
      `Creative image generation failed: ${diagnostic.replaceAll("_", " ")}.`,
    );
    this.name = "CreativeGenerationProviderError";
  }
}
function configured() {
  const value = process.env.OPENAI_API_KEY;
  if (!value) throw new CreativeGenerationProviderError("missing_api_key");
  return value;
}
