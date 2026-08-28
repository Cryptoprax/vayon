import { CreativeStudioHome } from "@/features/vayon/creative-studio-2/CreativeStudioHome";
import { CreativeStudio2Service } from "@/features/vayon/creative-studio-2/service";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";

export default async function Page() {
  const service = await CreativeStudio2Service.production();
  if (!service) return <FeatureAvailabilityState title="Creative Operating System" description="This workspace does not have Creative access yet. Join Early Access and we will notify you when governed creative production is available for your workspace." />;
  return <CreativeStudioHome snapshot={await service.snapshot()} />;
}
