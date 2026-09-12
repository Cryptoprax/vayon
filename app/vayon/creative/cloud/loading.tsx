import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export default function Loading() {
  return (
    <WorkspaceContent className="w-full animate-pulse space-y-5">
      <div className="h-52 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="h-44 rounded-3xl bg-vds-elevated" key={i} />
        ))}
      </div>
    </WorkspaceContent>
  );
}
