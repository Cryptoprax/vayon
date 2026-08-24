import { notFound } from "next/navigation";
import { FounderAccessError } from "@/features/platform/founder/services/founder-context";
import { IntelligenceHubDashboard } from "@/features/platform/intelligence-hub/components/IntelligenceHubDashboard";
import { IntelligenceHubService } from "@/features/platform/intelligence-hub/services/intelligence-hub.service";
import type { IntelligenceHubSnapshot } from "@/features/platform/intelligence-hub/types";
export const dynamic = "force-dynamic";
type Query = { q?: string; organization?: string; workspace?: string; user?: string; module?: string; from?: string; to?: string };
export default async function Page({ searchParams }: { searchParams: Promise<Query> }) { const raw = await searchParams, filters = { q: (raw.q ?? "").slice(0, 100), organization: (raw.organization ?? "").slice(0, 100), workspace: (raw.workspace ?? "").slice(0, 100), user: (raw.user ?? "").slice(0, 100), module: (raw.module ?? "").slice(0, 50), from: (raw.from ?? "").slice(0, 30), to: (raw.to ?? "").slice(0, 30) }; let data: IntelligenceHubSnapshot; try { data = await new IntelligenceHubService().snapshot(filters); } catch (error) { if (error instanceof FounderAccessError) notFound(); throw error; } return <IntelligenceHubDashboard data={data} filters={filters}/>; }
