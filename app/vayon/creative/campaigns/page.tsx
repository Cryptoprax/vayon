import { notFound } from "next/navigation";
import { CampaignStudio } from "@/features/vayon/campaign-studio/CampaignStudio";
import { CampaignStudioService } from "@/features/vayon/campaign-studio/service";
export default async function Page() {
  const service = await CampaignStudioService.production();
  if (!service) notFound();
  return <CampaignStudio snapshot={await service.snapshot()} />;
}
