import { notFound } from "next/navigation";
import { CreativePipelineDashboard } from "@/features/vayon/creative-pipeline/CreativePipelineDashboard";
import { CreativePipelineService } from "@/features/vayon/creative-pipeline/service";
export default async function Page() {
  const service = await CreativePipelineService.production();
  if (!service) notFound();
  return <CreativePipelineDashboard snapshot={await service.snapshot()} />;
}
