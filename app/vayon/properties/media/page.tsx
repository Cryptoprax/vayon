import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { InventoryHeader, MediaLibrary } from "@/features/vayon/property-platform/inventory/InventoryViews";
import { InventoryService } from "@/features/vayon/property-platform/inventory/service";
export default async function Page() { const service = await InventoryService.production(), snapshot = await service.snapshot(); return <WorkspaceContent><InventoryHeader title="Property media & documents" description="Manage floor plans, master plans, brochures, elevations, construction documents, images, and future-ready video surfaces through existing storage boundaries."/><MediaLibrary snapshot={snapshot}/></WorkspaceContent>; }
