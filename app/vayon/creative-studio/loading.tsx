import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
export default function Loading() {
  return (
    <WorkspaceContent
      aria-busy="true"
      aria-label="Loading Marketing Studio"
      className="animate-pulse space-y-5"
    >
      <div className="h-8 w-64 rounded-lg bg-vds-elevated" />
      <div className="h-4 max-w-xl rounded bg-vds-elevated" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            className="h-40 rounded-2xl border border-vds-border bg-vds-surface"
            key={item}
          />
        ))}
      </div>
      <span className="sr-only">
        Loading campaign data and provider status.
      </span>
    </WorkspaceContent>
  );
}
