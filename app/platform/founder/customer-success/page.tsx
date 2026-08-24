import { notFound } from "next/navigation";
import type { OpenAIHealth } from "@/features/platform/openai/domain/models";
import type { ConversationSnapshot } from "@/features/platform/openai/runtime/models";
import { WorkforceRuntimeService } from "@/features/platform/openai/runtime/service";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { CustomerGrowthDashboard } from "@/features/platform/customer-growth/components/CustomerGrowthDashboard";
import { CustomerGrowthService } from "@/features/platform/customer-growth/services/customer-growth.service";
import type { CustomerGrowthSnapshot } from "@/features/platform/customer-growth/types";

export const dynamic = "force-dynamic";
const unavailableHealth: OpenAIHealth = { state: "unavailable", connected: false, model: "unavailable", latencyMs: null, quota: "unknown", version: "unavailable", diagnostic: "provider_exception", reason: "Customer Success Copilot runtime is unavailable." };
const emptyHistory: ConversationSnapshot = { conversations: [], messages: [] };
export default async function Page({ searchParams }: { searchParams: Promise<{ question?: string }> }) { let data: CustomerGrowthSnapshot; try { data = await new CustomerGrowthService().snapshot(); } catch (error) { if (error instanceof FounderAccessError) notFound(); throw error; } const { question = "" } = await searchParams, runtime = await WorkforceRuntimeService.production().catch(() => null), [history, health] = runtime ? await Promise.all([runtime.history("executive-ai").catch(() => emptyHistory), runtime.health().catch(() => unavailableHealth)]) : [emptyHistory, unavailableHealth]; return <CustomerGrowthDashboard data={data} history={history} health={health} question={question.slice(0, 1000)}/>; }
