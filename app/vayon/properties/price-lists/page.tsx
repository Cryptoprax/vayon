import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { InventoryHeader, PriceHistory } from "@/features/vayon/property-platform/inventory/InventoryViews";
import { InventoryService } from "@/features/vayon/property-platform/inventory/service";
export default async function Page() { const service = await InventoryService.production(), snapshot = await service.snapshot(); return <WorkspaceContent><InventoryHeader title="Price lists" description="Review effective revisions, historical prices, offer rules, and approval-controlled manual discount overrides."/><PriceHistory snapshot={snapshot}/></WorkspaceContent>; }
