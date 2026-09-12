import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export default function Loading() {
  return (
    <WorkspaceContent
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading Customer Success Workspace"
    >
      <div className="h-36 animate-pulse rounded-3xl bg-vds-elevated" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-3xl bg-vds-elevated" />
        <div className="h-28 animate-pulse rounded-3xl bg-vds-elevated" />
        <div className="h-28 animate-pulse rounded-3xl bg-vds-elevated" />
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-vds-elevated" />
    </WorkspaceContent>
  );
}
