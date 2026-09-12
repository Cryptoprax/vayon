import { CreativeCloudDashboard } from "@/features/vayon/creative-cloud/CreativeCloudDashboard";
import { CreativeCloudService } from "@/features/vayon/creative-cloud/service";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export default async function Page() {
  const service = await CreativeCloudService.production();
  if (!service) return <FeatureAvailabilityState title="Creative Operating Model" description="Creative Cloud is not enabled for this workspace. Ask your workspace administrator about access." />;
  return <CreativeCloudDashboard snapshot={await service.snapshot()} />;
}
