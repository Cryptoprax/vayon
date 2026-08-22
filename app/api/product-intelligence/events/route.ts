import { z } from "zod";
import { productEventNames } from "@/features/platform/product-intelligence/contracts";
import { ProductIntelligenceService } from "@/features/platform/product-intelligence/services/product-intelligence.service";
const forbidden =
  /password|secret|token|authorization|cookie|email|phone|name|document|content|message|query|question|prompt|description|text|screenshot/i;
const event = z.object({
  name: z.enum(productEventNames),
  module: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,60}$/),
  path: z.string().startsWith("/vayon/").max(300),
  durationMs: z.number().int().min(0).max(86400000).optional(),
  outcome: z.enum(["success", "failure", "abandoned"]).optional(),
  anonymousSessionId: z.string().uuid(),
  metadata: z
    .record(z.string(), z.union([z.string().max(120), z.number(), z.boolean()]))
    .optional()
    .transform((value) =>
      value
        ? Object.fromEntries(
            Object.entries(value).filter(([key]) => !forbidden.test(key)),
          )
        : undefined,
    ),
});
const schema = z.object({ events: z.array(event).min(1).max(50) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  try {
    await new ProductIntelligenceService().recordBatch(parsed.data.events);
    return new Response(null, { status: 202 });
  } catch {
    return new Response(null, { status: 403 });
  }
}
