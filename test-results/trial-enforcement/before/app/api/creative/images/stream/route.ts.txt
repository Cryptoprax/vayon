import { generateImage } from "@/features/vayon/image-studio/actions";
import type { ImageGenerationRequest } from "@/features/vayon/image-studio/types";
const stages = ["Planning", "Generating", "Reviewing"] as const;
export async function POST(request: Request) {
  const input = (await request.json()) as ImageGenerationRequest,
    encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const stage of stages)
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "stage", stage })}\n`),
          );
        const result = await generateImage(input);
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "result", stage: result.assetId ? "Completed" : result.status, result })}\n`,
          ),
        );
      } catch {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "error", message: "Image generation could not be completed." })}\n`,
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
