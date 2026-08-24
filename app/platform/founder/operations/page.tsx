import { notFound } from "next/navigation";
import { AutonomousOperationsDashboard } from "@/features/platform/autonomous-operations/components/AutonomousOperationsDashboard";
import { AutonomousOperationsService } from "@/features/platform/autonomous-operations/services/autonomous-operations.service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";

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

export default async function Page() {
  let data;
  try {
    data = await new AutonomousOperationsService().snapshot();
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
    <AutonomousOperationsDashboard
      data={data}
      history={history}
      health={health}
    />
  );
}
