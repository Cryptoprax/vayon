import { subscriptionFailure, subscriptionMessage, subscriptionCenterHref } from "@/features/vayon/billing/services/subscription-write-contract";
import { guardSubscriptionApi } from "@/features/vayon/billing/services/subscription-write-guard";
import { z } from "zod";
import { AICollaborationService } from "@/features/platform/ai-collaboration";
import { enforceApiPermission } from "@/features/platform/permissions/runtime/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounder } from "@/features/platform/founder/services/founder-context";
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
  // AI Company Orchestration is Founder/Super Admin-only tooling -- its intended UI
  // (app/platform/founder/command-center) already sits behind app/platform/layout.tsx's
  // isFounder() gate, but that gate does not protect this API route itself. Reuse the
  // same canonical founder-check primitive here so a normal authenticated customer
  // cannot invoke this endpoint directly even with valid ai_employees permission.
  const { data: { user } } = await (await createSupabaseServerClient()).auth.getUser();
  if (!isFounder(user)) return Response.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  const authorization=await enforceApiPermission("ai_employees","create");
  if(authorization.response)return authorization.response;
const subscriptionResponse = await guardSubscriptionApi(); if (subscriptionResponse) return subscriptionResponse;

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
  } catch (error) {
    const decision = subscriptionFailure(error);
    if (decision) return Response.json({ ...decision, message: subscriptionMessage(decision), subscriptionCenter: subscriptionCenterHref(decision) }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
    return Response.json(
      {
        error: "Collaboration runtime could not complete the governed request.",
      },
      { status: 503 },
    );
  }
}
