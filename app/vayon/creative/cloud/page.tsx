import { notFound } from "next/navigation";
import { CreativeCloudDashboard } from "@/features/vayon/creative-cloud/CreativeCloudDashboard";
import { CreativeCloudService } from "@/features/vayon/creative-cloud/service";
export default async function Page() {
  const service = await CreativeCloudService.production();
  if (!service) notFound();
  return <CreativeCloudDashboard snapshot={await service.snapshot()} />;
}
