import { notFound } from "next/navigation";
import { VideoStudio } from "@/features/vayon/video-studio/VideoStudio";
import { VideoStudioService } from "@/features/vayon/video-studio/service";
export default async function Page() {
  const service = await VideoStudioService.production();
  if (!service) notFound();
  return <VideoStudio snapshot={await service.snapshot()} />;
}
