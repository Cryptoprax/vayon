import { SmartEmptyState } from "@/features/vayon/components/SmartEmptyState";
import { CampaignStudio } from "@/features/vayon/campaign-studio/CampaignStudio";
import { CampaignStudioService } from "@/features/vayon/campaign-studio/service";
export default async function Page() {
  const service = await CampaignStudioService.production();
  if (!service) return <main className="mx-auto max-w-4xl px-5 py-8"><SmartEmptyState title="Campaign creation is not ready yet" description="You can keep working on your properties and leads while campaign creation is unavailable in this workspace." primaryLabel="Open Properties" primaryHref="/vayon/properties" /></main>;
  return <CampaignStudio snapshot={await service.snapshot()} />;
}
