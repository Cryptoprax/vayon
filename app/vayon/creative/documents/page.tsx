import { notFound } from "next/navigation";
import { DocumentStudio } from "@/features/vayon/document-studio/DocumentStudio";
import { DocumentStudioService } from "@/features/vayon/document-studio/service";
export default async function Page() {
  const service = await DocumentStudioService.production();
  if (!service) notFound();
  return <DocumentStudio snapshot={await service.snapshot()} />;
}
