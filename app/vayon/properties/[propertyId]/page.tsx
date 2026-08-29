import { notFound } from "next/navigation";
import { CrmAutomationService } from "@/features/vayon/crm-automation/service";
import { PropertyCrmSummary } from "@/features/vayon/crm-automation/PropertyCrmSummary";
import { PropertyService } from "@/features/vayon/property/services/property.service";
import { WorkspaceRenderer } from "@/features/vayon/workspace-engine/components/WorkspaceRenderer";
import {
  normalizeWorkspaceTab,
  propertyWorkspaceModel,
} from "@/features/vayon/workspace-engine/services/workspace-adapter.service";
import { WorkspaceRegistryService } from "@/features/vayon/workspace-engine/services/workspace-registry.service";
import { ContextualRealEstateRecommendations, RealEstateSignalGrid } from "@/features/vayon/real-estate-experience/RealEstateSurfaces";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ tab?: string; success?: string }>;
}) {
  const id = (await params).propertyId;
  const [property, crm] = await Promise.all([
    new PropertyService().detail(id),
    (await CrmAutomationService.production()).property(id),
  ]);
  if (!property) notFound();

  const query = await searchParams;
  const tabs = new WorkspaceRegistryService().visibleTabs("property-workspace");
  const active = normalizeWorkspaceTab(query.tab, tabs);

  return (
    <>
      {query.success && (
        <p role="status" className="mx-auto mt-5 max-w-[96rem] rounded-xl bg-vds-success-soft p-3 text-sm text-vds-success">
          {query.success}
        </p>
      )}
      <PropertyCrmSummary model={crm} />
      <WorkspaceRenderer model={propertyWorkspaceModel(property)} activeTab={active} editHref={`/vayon/properties/${id}/edit`} />
      <RealEstateSignalGrid kind="property" values={{ "AI Listing Score": property.aiScore == null ? undefined : `${property.aiScore}/100`, "Marketing Status": property.published ? "Published" : "Not published", "Suggested Improvements": property.description ? "Review listing performance" : "Add a complete property description" }} />
      <ContextualRealEstateRecommendations kind="property" />
    </>
  );
}
