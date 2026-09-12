import { generateDocument } from "@/features/vayon/document-studio/actions";
import type { DocumentWizardInput } from "@/features/vayon/document-studio/types";
const stages = ["Planning", "Writing", "Brand Review", "Formatting"] as const;
export async function POST(request: Request) {
  const input = (await request.json()) as DocumentWizardInput,
    encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const stage of stages)
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "stage", stage })}\n`),
          );
        const submission = await generateDocument(input);
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "result", stage: submission.document ? "Completed" : submission.result.status, submission })}\n`,
          ),
        );
      } catch {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({ type: "error", message: "Document generation could not be completed." })}\n`,
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
