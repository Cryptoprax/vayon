import { notFound } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { UnifiedAIContextDashboard } from "@/features/platform/unified-ai-context/components/UnifiedAIContextDashboard";
import { UnifiedAIContextService } from "@/features/platform/unified-ai-context/services/unified-ai-context.service";
export const dynamic = "force-dynamic";
const unavailable: OpenAIHealth = {
    state: "unavailable",
    connected: false,
    model: "unavailable",
    latencyMs: null,
    quota: "unknown",
    version: "unavailable",
    diagnostic: "provider_exception",
    reason: "Founder AI runtime is unavailable.",
  },
  empty: ConversationSnapshot = { conversations: [], messages: [] };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = ((await searchParams).q ?? "").slice(0, 120);
  let data;
  try {
    data = await new UnifiedAIContextService().snapshot(query);
  } catch (error) {
    if (error instanceof FounderAccessError) notFound();
    throw error;
  }
  const runtime = await WorkforceRuntimeService.production().catch(() => null),
    [history, health] = runtime
      ? await Promise.all([
          runtime.history("executive-ai").catch(() => empty),
          runtime.health().catch(() => unavailable),
        ])
      : [empty, unavailable];
  return (
    <UnifiedAIContextDashboard
      data={data}
      history={history}
      health={health}
      query={query}
    />
  );
}
