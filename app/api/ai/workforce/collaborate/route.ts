import { z } from "zod";
import { AICollaborationService } from "@/features/platform/ai-collaboration";
import { enforceApiPermission } from "@/features/platform/permissions/runtime/http";
const employee = z.enum([
    "sales-ai",
    "crm-ai",
    "marketing-ai",
    "whatsapp-ai",
    "voice-ai",
    "operations-ai",
    "finance-ai",
    "executive-ai",
  ]),
  schema = z.object({
    requestedBy: employee,
    scenario: z.enum([
      "lead-created",
      "deal-at-risk",
      "new-customer",
      "custom",
    ]),
    objective: z.string().trim().min(1).max(2000),
    relatedCustomerId: z.string().uuid().optional(),
    agents: z.array(employee).min(1).max(8).optional(),
  });
export async function POST(request: Request) {
  const authorization=await enforceApiPermission("ai_employees","create");
  if(authorization.response)return authorization.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid collaboration request." },
      { status: 400 },
    );
  try {
    return Response.json(
      await (
        await AICollaborationService.production()
      ).collaborate(parsed.data),
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error: "Collaboration runtime could not complete the governed request.",
      },
      { status: 503 },
    );
  }
}
