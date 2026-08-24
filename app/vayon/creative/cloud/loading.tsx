export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[120rem] animate-pulse space-y-5 px-4 py-6">
      <div className="h-52 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="h-44 rounded-3xl bg-vds-elevated" key={i} />
        ))}
      </div>
    </main>
  );
}
