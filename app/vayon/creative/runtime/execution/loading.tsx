import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export default function Loading() {
  return (
    <WorkspaceContent className="w-full animate-pulse space-y-5">
      <div className="h-48 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="h-32 rounded-3xl bg-vds-elevated" key={i} />
        ))}
      </div>
    </WorkspaceContent>
  );
}
