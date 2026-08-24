import { z } from "zod";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { EnterpriseRateLimitService, requestSubject } from "@/features/platform/security-review/services/rate-limit.service";
import { enforceApiPermission } from "@/features/platform/permissions/runtime/http";

const schema = z.object({
  employee: z.enum(["sales-ai", "crm-ai", "marketing-ai", "whatsapp-ai", "voice-ai", "operations-ai", "finance-ai", "executive-ai"]),
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(20_000),
  contextRefs: z.array(z.object({ type: z.enum(["crm", "gmail", "calendar", "whatsapp", "deal", "task"]), id: z.string().min(1).max(100) })).max(50).optional(),
});

export async function POST(request: Request) {
  const authorization=await enforceApiPermission("ai_employees","create");
  if(authorization.response)return authorization.response;
  const limit = await new EnterpriseRateLimitService().enforce("ai-runtime", requestSubject(request));
  if (!limit.allowed) return Response.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid chat request." }, { status: 400 });
  try {
    const runtime = await WorkforceRuntimeService.production();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({ async start(controller) { try { for await (const event of runtime.chat(parsed.data)) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); } catch { controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message: "The AI provider could not complete this request." })}\n`)); } finally { controller.close(); } } });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return Response.json({ error: "AI runtime unavailable." }, { status: 503 }); }
}
