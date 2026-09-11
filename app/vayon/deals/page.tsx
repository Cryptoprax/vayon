import { ButtonLink } from "@/features/platform/design-system";
import { DealBoard, PipelineStatistics } from "@/features/vayon/deal/components/DealBoard";
import { ContextualRealEstateRecommendations } from "@/features/vayon/real-estate-experience/RealEstateSurfaces";
import { transactionStages } from "@/features/vayon/real-estate-experience/catalog";
import { PipelineService } from "@/features/vayon/deal/services/pipeline.service";

export default async function Page() {
  const data = await new PipelineService().board();
  return <main className="w-full min-w-0 py-6"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-vds-primary">Negotiation and closing</p><h1 className="mt-2 text-3xl font-semibold">Move deals toward closing</h1><p className="mt-2 text-sm text-vds-muted">Move buyers and sellers from qualification through viewing, offer, legal verification, registration, and completion.</p></div><ButtonLink href="/vayon/deals/new" className="rounded-full">Create Deal</ButtonLink></div><nav aria-label="Transaction stages" className="mt-6 flex snap-x gap-2 overflow-x-auto pb-2">{transactionStages.map((stage) => <span className="shrink-0 snap-start rounded-full border border-vds-border bg-vds-surface px-3 py-2 text-xs" key={stage}>{stage}</span>)}</nav><div className="mt-7"><PipelineStatistics data={data}/></div><div className="mt-7">{!data.deals.length ? <div className="rounded-3xl border border-dashed border-vds-border p-10 text-center"><h2 className="text-xl font-semibold">No deals yet</h2><p className="mt-2 text-sm text-vds-muted">Use Create Deal above to record the buyer, property, offer and next closing step.</p></div> : <DealBoard data={data} />}</div><ContextualRealEstateRecommendations kind="transaction" /></main>;
}
