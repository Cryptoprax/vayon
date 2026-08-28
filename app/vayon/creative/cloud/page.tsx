import { CreativeCloudDashboard } from "@/features/vayon/creative-cloud/CreativeCloudDashboard";
import { CreativeCloudService } from "@/features/vayon/creative-cloud/service";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export default async function Page() {
  const service = await CreativeCloudService.production();
  if (!service) return <FeatureAvailabilityState title="Creative Operating Model" description="Creative Cloud is being prepared for this workspace. Join Early Access to receive availability updates without encountering an incomplete setup." />;
  return <CreativeCloudDashboard snapshot={await service.snapshot()} />;
}
