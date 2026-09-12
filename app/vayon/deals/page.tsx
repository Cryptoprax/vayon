import { WorkspaceContent, WorkspaceHeader, WorkspaceEmptyState } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { ButtonLink } from "@/features/platform/design-system";
import { DealBoard, PipelineStatistics } from "@/features/vayon/deal/components/DealBoard";
import { ContextualRealEstateRecommendations } from "@/features/vayon/real-estate-experience/RealEstateSurfaces";
import { transactionStages } from "@/features/vayon/real-estate-experience/catalog";
import { PipelineService } from "@/features/vayon/deal/services/pipeline.service";

export default async function Page() {
  const data = await new PipelineService().board();
  return <WorkspaceContent ><WorkspaceHeader title="Move deals toward closing" description="Move buyers and sellers from qualification through viewing, offer, legal verification, registration, and completion." actions={<ButtonLink href="/vayon/deals/new">Create Deal</ButtonLink>} /><nav aria-label="Transaction stages" className="mt-6 flex flex-wrap gap-3 pb-2">{transactionStages.map((stage) => <span className="shrink-0 snap-start rounded-full border border-vds-border bg-vds-surface px-3 py-2 text-xs" key={stage}>{stage}</span>)}</nav><div className="mt-7"><PipelineStatistics data={data}/></div><div className="mt-7">{!data.deals.length ? <WorkspaceEmptyState title="No deals yet" description="Track offers and the steps needed to close a sale." nextStep="Use Create Deal above to record the buyer, property, offer and next closing step." /> : <DealBoard data={data} />}</div><ContextualRealEstateRecommendations kind="transaction" /></WorkspaceContent>;
}
