import { generateVideo } from "@/features/vayon/video-studio/actions";
import type { VideoWizardInput } from "@/features/vayon/video-studio/types";
const stages = ["Planning", "Storyboarding", "Rendering", "Reviewing"] as const;
export async function POST(request: Request) {
  const input = (await request.json()) as VideoWizardInput,
    encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const stage of stages)
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "stage", stage })}\n`),
          );
        const result = await generateVideo(input);
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "result", stage: result.assetId ? "Completed" : result.status, result })}\n`,
          ),
        );
      } catch {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "error", message: "Video generation could not be completed." })}\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
