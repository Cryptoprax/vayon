import { notFound } from "next/navigation";
import { InventoryHeader, ProjectDetail } from "@/features/vayon/property-platform/inventory/InventoryViews";
import { InventoryService } from "@/features/vayon/property-platform/inventory/service";
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params, service = await InventoryService.production(), snapshot = await service.snapshot(), project = snapshot.projects.find((item) => item.id === projectId); if (!project) notFound(); return <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-5"><InventoryHeader title={project.name} description={`${project.code} · ${project.developer} · ${project.projectType}`}/><ProjectDetail project={project} snapshot={snapshot}/></main>; }
