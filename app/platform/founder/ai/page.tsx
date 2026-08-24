import { notFound } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { FounderAIHome } from "@/features/platform/founder-ai/components/FounderAIHome";
import { FounderAIService } from "@/features/platform/founder-ai/services/founder-ai.service";
import type { FounderAISnapshot } from "@/features/platform/founder-ai/types";

export const dynamic = "force-dynamic";
const unavailableHealth: OpenAIHealth = { state: "unavailable", connected: false, model: "unavailable", latencyMs: null, quota: "unknown", version: "unavailable", diagnostic: "provider_exception", reason: "Founder AI runtime is unavailable." };
const emptyHistory: ConversationSnapshot = { conversations: [], messages: [] };
export default async function Page({ searchParams }: { searchParams: Promise<{ question?: string }> }) { let data: FounderAISnapshot; try { data = await new FounderAIService().snapshot(); } catch (error) { if (error instanceof FounderAccessError) notFound(); throw error; } const { question = "" } = await searchParams, runtime = await WorkforceRuntimeService.production().catch(() => null), [history, health] = runtime ? await Promise.all([runtime.history("executive-ai").catch(() => emptyHistory), runtime.health().catch(() => unavailableHealth)]) : [emptyHistory, unavailableHealth], hour = new Date().getHours(), greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"; return <FounderAIHome data={data} history={history} health={health} question={question.slice(0, 1000)} greeting={greeting}/>; }
