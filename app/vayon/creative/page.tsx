import { CreativeStudioHome } from "@/features/vayon/creative-studio-2/CreativeStudioHome";
import { CreativeStudio2Service } from "@/features/vayon/creative-studio-2/service";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";

export default async function Page() {
  const service = await CreativeStudio2Service.production();
  if (!service) return <FeatureAvailabilityState title="Creative Operating System" description="Creative access is not enabled for this workspace. Ask your workspace administrator about access." />;
  return <CreativeStudioHome snapshot={await service.snapshot()} />;
}
