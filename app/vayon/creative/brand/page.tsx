import { notFound } from "next/navigation";
import { BrandStudio } from "@/features/vayon/brand-studio/BrandStudio";
import { BrandStudioService } from "@/features/vayon/brand-studio/service";
export default async function Page() {
  const service = await BrandStudioService.production();
  if (!service) notFound();
  return <BrandStudio snapshot={await service.snapshot()} />;
}
