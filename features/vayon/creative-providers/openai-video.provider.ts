import "server-only";
import OpenAI from "openai";
import { classifyOpenAIHealthError } from "@/features/platform/openai/providers/openai.provider";
type VideoClient = Pick<OpenAI, "videos">;
export interface VideoProviderRequest {
  readonly prompt: string;
  readonly seconds: "4" | "8" | "12";
  readonly size: "720x1280" | "1280x720" | "1024x1792" | "1792x1024";
  readonly signal: AbortSignal;
  readonly sourceVideoId?: string;
}
export interface VideoProviderResult {
  readonly bytes: Uint8Array;
  readonly thumbnail: Uint8Array | null;
  readonly videoId: string;
  readonly model: string;
  readonly seconds: string;
  readonly size: string;
  readonly latencyMs: number;
}
const configured = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_MISSING_API_KEY");
  return key;
};
export class OpenAIVideoProvider {
  constructor(private api?: VideoClient) {}
  private client() {
    return (
      this.api ??
      new OpenAI({
        apiKey: configured(),
        maxRetries: 2,
        timeout: Number(process.env.OPENAI_VIDEO_TIMEOUT_MS ?? 600_000),
      })
    );
  }
  async health() {
    try {
      await this.client().videos.list({ limit: 1 });
      return {
        available: true as const,
        reason: "OpenAI video API available.",
      };
    } catch (error) {
      return {
        available: false as const,
        reason: classifyOpenAIHealthError(error),
      };
    }
  }
  async generate(input: VideoProviderRequest) {
    const started = performance.now(),
      api = this.client(),
      job = input.sourceVideoId
        ? await api.videos.edit(
            { video: { id: input.sourceVideoId }, prompt: input.prompt },
            { signal: input.signal },
          )
        : await api.videos.create(
            {
              model: process.env.OPENAI_VIDEO_MODEL ?? "sora-2",
              prompt: input.prompt,
              seconds: input.seconds,
              size: input.size,
            },
            { signal: input.signal },
          ),
      completed = await this.wait(api, job.id, input.signal);
    return this.download(api, completed, started, input.signal);
  }
  private async wait(api: VideoClient, id: string, signal: AbortSignal) {
    for (;;) {
      if (signal.aborted)
        throw new DOMException("Video generation cancelled.", "AbortError");
      const job = await api.videos.retrieve(id, { signal });
      if (job.status === "completed") return job;
      if (job.status === "failed")
        throw new Error(
          `Video generation failed: ${job.error?.code ?? "provider_error"}.`,
        );
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          resolve,
          Number(process.env.OPENAI_VIDEO_POLL_INTERVAL_MS ?? 2000),
        );
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(
              new DOMException("Video generation cancelled.", "AbortError"),
            );
          },
          { once: true },
        );
      });
    }
  }
  private async download(
    api: VideoClient,
    job: Awaited<ReturnType<VideoClient["videos"]["retrieve"]>>,
    started: number,
    signal: AbortSignal,
  ): Promise<VideoProviderResult> {
    const [video, thumbnail] = await Promise.all([
      api.videos.downloadContent(job.id, { variant: "video" }, { signal }),
      api.videos
        .downloadContent(job.id, { variant: "thumbnail" }, { signal })
        .catch(() => null),
    ]);
    return {
      bytes: new Uint8Array(await video.arrayBuffer()),
      thumbnail: thumbnail
        ? new Uint8Array(await thumbnail.arrayBuffer())
        : null,
      videoId: job.id,
      model: String(job.model),
      seconds: String(job.seconds),
      size: String(job.size),
      latencyMs: Math.round(performance.now() - started),
    };
  }
}
