import { notFound } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { MarketingDirectorDashboard } from "@/features/platform/marketing-director/components/MarketingDirectorDashboard";
import { MarketingDirectorService } from "@/features/platform/marketing-director/services/marketing-director.service";
import type { MarketingDirectorSnapshot } from "@/features/platform/marketing-director/types";

export const dynamic = "force-dynamic";
const unavailableHealth: OpenAIHealth = { state: "unavailable", connected: false, model: "unavailable", latencyMs: null, quota: "unknown", version: "unavailable", diagnostic: "provider_exception", reason: "Marketing AI runtime is unavailable." };
const emptyHistory: ConversationSnapshot = { conversations: [], messages: [] };
export default async function Page({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  let data: MarketingDirectorSnapshot;
  try { data = await new MarketingDirectorService().snapshot(); } catch (error) { if (error instanceof FounderAccessError) notFound(); throw error; }
  const { goal = "" } = await searchParams;
  const runtime = await WorkforceRuntimeService.production().catch(() => null);
  const [history, health] = runtime ? await Promise.all([runtime.history("marketing-ai").catch(() => emptyHistory), runtime.health().catch(() => unavailableHealth)]) : [emptyHistory, unavailableHealth];
  return <MarketingDirectorDashboard data={data} history={history} health={health} goal={goal.slice(0, 1000)}/>;
}
