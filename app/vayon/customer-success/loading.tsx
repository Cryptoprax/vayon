export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8"
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
    </main>
  );
}
