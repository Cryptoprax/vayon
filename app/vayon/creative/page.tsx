import { notFound } from "next/navigation";
import { CreativeStudioHome } from "@/features/vayon/creative-studio-2/CreativeStudioHome";
import { CreativeStudio2Service } from "@/features/vayon/creative-studio-2/service";

export default async function Page() {
  const service = await CreativeStudio2Service.production();
  if (!service) notFound();
  return <CreativeStudioHome snapshot={await service.snapshot()} />;
}
