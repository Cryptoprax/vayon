import { CampaignWizard, StudioShell } from "@/features/vayon/creative-studio/components/StudioViews";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";

export default async function Page({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const service = await CreativeStudioService.production();
  if (!service) return <main className="space-y-3 p-6"><h1 className="text-2xl font-semibold">Campaigns</h1><p>Continue when Campaigns become available</p></main>;
  const { inventory } = await service.projectContext();
  const { goal = "" } = await searchParams;
  return <StudioShell title="Create Campaign" description="Choose an existing property project, audience and channels, then save a campaign draft for review.">
    {inventory.projects.length ? <CampaignWizard projects={inventory.projects} initialObjective={goal.slice(0, 1000)} /> : <section className="space-y-4 rounded-2xl border border-vds-border p-6"><h2 className="text-lg font-semibold">Continue when Campaigns become available</h2><p className="text-sm text-vds-muted">Campaign drafts need project inventory. Ask your workspace administrator to make an existing project available.</p></section>}
  </StudioShell>;
}
