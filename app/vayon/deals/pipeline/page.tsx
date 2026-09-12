import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { ButtonLink } from "@/features/platform/design-system";
import { DealBoard, PipelineStatistics } from "@/features/vayon/deal/components/DealBoard";
import { PipelineService } from "@/features/vayon/deal/services/pipeline.service";

export default async function Page() {
  const data = await new PipelineService().board();
  return <WorkspaceContent ><WorkspaceHeader ><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Enterprise sales pipeline</p><h1 className="mt-2 text-3xl font-semibold">Pipeline</h1><p className="mt-2 max-w-3xl text-sm text-vds-muted">Move deals through workspace stages, inspect weighted value, and keep forecast changes tenant-scoped and audit-ready.</p></div><div className="flex gap-2"><ButtonLink href="/vayon/deals/analytics" variant="outline">Pipeline reports</ButtonLink><ButtonLink href="/vayon/deals/new">New opportunity</ButtonLink></div></WorkspaceHeader><section className="mt-6"><PipelineStatistics data={data}/></section><section className="mt-6"><DealBoard data={data}/></section></WorkspaceContent>;
}
