import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export default function Loading() {
  return (
    <WorkspaceContent className="w-full animate-pulse space-y-5">
      <div className="h-52 rounded-3xl bg-vds-elevated" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="h-52 rounded-3xl bg-vds-elevated" />
        <div className="h-52 rounded-3xl bg-vds-elevated" />
        <div className="h-52 rounded-3xl bg-vds-elevated" />
        <div className="h-52 rounded-3xl bg-vds-elevated" />
      </div>
    </WorkspaceContent>
  );
}
