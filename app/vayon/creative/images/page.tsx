import { notFound } from "next/navigation";
import { ImageStudio } from "@/features/vayon/image-studio/ImageStudio";
import { ImageStudioService } from "@/features/vayon/image-studio/service";
export default async function Page() {
  const service = await ImageStudioService.production();
  if (!service) notFound();
  return <ImageStudio snapshot={await service.snapshot()} />;
}
