export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[120rem] space-y-6 px-4 py-8"
      aria-busy="true"
      aria-label="Loading Unified AI Memory"
    >
      <div className="h-44 animate-pulse rounded-3xl bg-vds-elevated" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            className="h-28 animate-pulse rounded-3xl bg-vds-elevated"
            key={index}
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-3xl bg-vds-elevated" />
    </main>
  );
}
