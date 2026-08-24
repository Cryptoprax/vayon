export default function Loading() {
  return (
    <main
      className="mx-auto max-w-[120rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading VAYON AI Command Center"
    >
      <div className="h-36 animate-pulse rounded-3xl bg-vds-elevated" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            className="h-48 animate-pulse rounded-3xl bg-vds-elevated"
            key={index}
          />
        ))}
      </div>
    </main>
  );
}
