import { notFound } from "next/navigation";
import { GrowthCampaignChat } from "@/features/vayon/creative-studio/components/GrowthCampaignChat";
import { GrowthOverview } from "@/features/vayon/creative-studio/components/GrowthViews";
import { StudioShell } from "@/features/vayon/creative-studio/components/StudioViews";
import { GrowthStudioService } from "@/features/vayon/creative-studio/growth.service";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";
export default async function Page() {
  const studio = await CreativeStudioService.production();
  if (!studio) notFound();
  const service = new GrowthStudioService(),
    [{ properties }, dashboard] = await Promise.all([
      studio.projectContext(),
      service.dashboard(),
    ]);
  return (
    <StudioShell
      title="AI Growth Studio"
      description="Plan complete multilingual real estate campaign packs from authoritative project data. Every output remains a governed draft."
    >
      <GrowthCampaignChat properties={properties} />
      <div className="mt-6">
        <GrowthOverview
          packs={dashboard.packs}
          review={service.review()}
          plan={service.plan()}
        />
      </div>
    </StudioShell>
  );
}
