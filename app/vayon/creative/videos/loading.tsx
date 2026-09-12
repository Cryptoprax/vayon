import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export default function Loading() {
  return (
    <WorkspaceContent className="animate-pulse space-y-5">
      <div className="h-44 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-3xl bg-vds-elevated lg:col-span-2" />
        <div className="h-64 rounded-3xl bg-vds-elevated" />
      </div>
    </WorkspaceContent>
  );
}
