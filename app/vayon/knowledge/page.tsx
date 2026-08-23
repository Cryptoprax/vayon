import { KnowledgeCenter } from "@/features/platform/knowledge/components/KnowledgeCenter";
import { KnowledgeRecovery } from "@/features/platform/knowledge/components/KnowledgeRecovery";
import { EnterpriseKnowledgeService } from "@/features/platform/knowledge/services/knowledge.service";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.slice(0, 300) ?? "";
  const result = await new EnterpriseKnowledgeService().loadSnapshot(q);
  if (result.status === "unavailable") return <KnowledgeRecovery failure={result.failure} correlationId={result.correlationId} />;
  return <KnowledgeCenter snapshot={result.snapshot} />;
}
