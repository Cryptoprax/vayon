import { notFound } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { SalesDirectorDashboard } from "@/features/platform/sales-director/components/SalesDirectorDashboard";
import { SalesDirectorService } from "@/features/platform/sales-director/services/sales-director.service";
import type { SalesDirectorSnapshot } from "@/features/platform/sales-director/types";
import { SalesAIService } from "@/features/platform/sales-ai/services/sales-ai.service";
import { PipelineService } from "@/features/vayon/deal/services/pipeline.service";

export const dynamic = "force-dynamic";
const unavailableHealth: OpenAIHealth = { state: "unavailable", connected: false, model: "unavailable", latencyMs: null, quota: "unknown", version: "unavailable", diagnostic: "provider_exception", reason: "Sales AI runtime is unavailable." };
const emptyHistory: ConversationSnapshot = { conversations: [], messages: [] };
export default async function Page({ searchParams }: { searchParams: Promise<{ question?: string }> }) {
  let data: SalesDirectorSnapshot;
  try { data = await new SalesDirectorService().snapshot(); } catch (error) { if (error instanceof FounderAccessError) notFound(); throw error; }
  const { question = "" } = await searchParams;
  const [intelligence, pipeline, runtime] = await Promise.all([SalesAIService.production().then((service) => service.dashboard()).catch(() => null), new PipelineService().board().catch(() => null), WorkforceRuntimeService.production().catch(() => null)]);
  const [history, health] = runtime ? await Promise.all([runtime.history("sales-ai").catch(() => emptyHistory), runtime.health().catch(() => unavailableHealth)]) : [emptyHistory, unavailableHealth];
  return <SalesDirectorDashboard data={data} intelligence={intelligence} pipeline={pipeline} history={history} health={health} question={question.slice(0, 1000)}/>;
}
