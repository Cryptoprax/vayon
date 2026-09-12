import { WorkspaceContent, WorkspaceHeader, WorkspaceEmptyState } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { CampaignWizard, StudioShell } from "@/features/vayon/creative-studio/components/StudioViews";
import { CreativeStudioService } from "@/features/vayon/creative-studio/service";

export default async function Page({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const service = await CreativeStudioService.production();
  if (!service) return <WorkspaceContent ><WorkspaceHeader title="Campaigns" description="Prepare property campaigns for your audience and channels." /><WorkspaceEmptyState title="Continue when Campaigns become available" description="Your workspace does not currently have access to campaign creation." nextStep="Ask your workspace administrator to enable the existing campaign workflow." /></WorkspaceContent>;
  const { inventory } = await service.projectContext();
  const { goal = "" } = await searchParams;
  return <StudioShell title="Create Campaign" description="Choose an existing property project, audience and channels, then save a campaign draft for review.">
    {inventory.projects.length ? <CampaignWizard projects={inventory.projects} initialObjective={goal.slice(0, 1000)} /> : <WorkspaceEmptyState title="Continue when Campaigns become available" description="Campaign drafts need project inventory." nextStep="Ask your workspace administrator to make an existing project available." />}
  </StudioShell>;
}
