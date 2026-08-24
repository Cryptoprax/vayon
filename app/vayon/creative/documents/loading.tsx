export default function Loading() {
  return (
    <main className="mx-auto max-w-[120rem] animate-pulse space-y-5 p-6">
      <div className="h-44 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-40 rounded-3xl bg-vds-elevated" />
        <div className="h-40 rounded-3xl bg-vds-elevated" />
        <div className="h-40 rounded-3xl bg-vds-elevated" />
      </div>
    </main>
  );
}
