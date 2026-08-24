export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[120rem] animate-pulse space-y-5 px-4 py-6">
      <div className="h-48 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="h-32 rounded-3xl bg-vds-elevated" key={i} />
        ))}
      </div>
    </main>
  );
}
