import { redirect } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { CustomerSuccessWorkspace } from "@/features/platform/customer-success-workspace/components/CustomerSuccessWorkspace";
import { CustomerSuccessWorkspaceService } from "@/features/platform/customer-success-workspace/services/customer-success-workspace.service";

export const dynamic = "force-dynamic";
const unavailable: OpenAIHealth = {
    state: "unavailable",
    connected: false,
    model: "unavailable",
    latencyMs: null,
    quota: "unknown",
    version: "unavailable",
    diagnostic: "provider_exception",
    reason: "AI onboarding is temporarily unavailable.",
  },
  empty: ConversationSnapshot = { conversations: [], messages: [] };

export default async function Page() {
  const service = new CustomerSuccessWorkspaceService();
  let data;
  try {
    data = await service.snapshot();
  } catch {
    redirect("/login?next=/vayon/customer-success");
  }
  const runtime = await WorkforceRuntimeService.production().catch(() => null),
    [history, health] = runtime
      ? await Promise.all([
          runtime.history("executive-ai").catch(() => empty),
          runtime.health().catch(() => unavailable),
        ])
      : [empty, unavailable];
  return (
    <CustomerSuccessWorkspace data={data} history={history} health={health} />
  );
}
