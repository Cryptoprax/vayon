import { WorkspaceContent, WorkspaceHeader, WorkspaceEmptyState } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export function FeatureAvailabilityState({ title, description }: { readonly title: string; readonly description: string }) {
  return <WorkspaceContent><WorkspaceHeader title={title} /><WorkspaceEmptyState title="This workspace is not available yet" description={description} nextStep="Return to today's work to continue with the tools available to your workspace." action={{ label: "Return to today's work", href: "/vayon/dashboard" }} /></WorkspaceContent>;
}
