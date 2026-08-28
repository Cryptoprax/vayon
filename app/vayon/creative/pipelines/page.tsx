import { CreativePipelineDashboard } from "@/features/vayon/creative-pipeline/CreativePipelineDashboard";
import { CreativePipelineService } from "@/features/vayon/creative-pipeline/service";
import { FeatureAvailabilityState } from "@/features/vayon/empty-states/FeatureAvailabilityState";
export default async function Page() {
  const service = await CreativePipelineService.production();
  if (!service) return <FeatureAvailabilityState title="Creative Production Orchestration" description="Creative production pipelines are not enabled for this workspace yet. Join Early Access for a guided activation when the module becomes available." />;
  return <CreativePipelineDashboard snapshot={await service.snapshot()} />;
}
