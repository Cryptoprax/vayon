import { notFound } from "next/navigation";
import { LeadService } from "@/features/vayon/lead/services/lead.service";
import { ContextualRealEstateRecommendations, RealEstateSignalGrid } from "@/features/vayon/real-estate-experience/RealEstateSurfaces";
import { WorkspaceRenderer } from "@/features/vayon/workspace-engine/components/WorkspaceRenderer";
import { leadWorkspaceModel, normalizeWorkspaceTab } from "@/features/vayon/workspace-engine/services/workspace-adapter.service";
import { WorkspaceRegistryService } from "@/features/vayon/workspace-engine/services/workspace-registry.service";
import { ContextualAIActions } from "@/features/vayon/cross-module-intelligence/ContextualAIActions";
import { EntityCollaboration } from "@/features/vayon/enterprise-collaboration/CollaborationSurfaces";

export default async function Page({ params, searchParams }: { params: Promise<{ leadId: string }>; searchParams: Promise<{ tab?: string; success?: string }> }) {
  const id = (await params).leadId;
  const lead = await new LeadService().detail(id);
  if (!lead) notFound();
  const query = await searchParams;
  const tabs = new WorkspaceRegistryService().visibleTabs("lead-workspace");
  const active = normalizeWorkspaceTab(query.tab, tabs);
  return <>{query.success && <p role="status" className="mx-auto mt-5 max-w-[96rem] rounded-xl bg-vds-success-soft p-3 text-sm text-vds-success">{query.success}</p>}<WorkspaceRenderer model={leadWorkspaceModel(lead)} activeTab={active} editHref={`/vayon/leads/${id}/edit`} /><RealEstateSignalGrid kind="lead" /><ContextualRealEstateRecommendations kind="lead" /><ContextualAIActions kind="lead" recordId={id} /><div className="mx-auto mb-8 max-w-[96rem] px-4 sm:px-6"><EntityCollaboration entityType="lead" entityId={id} entityLabel="Lead" /></div></>;
}
