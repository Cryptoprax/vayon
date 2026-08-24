export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[110rem] animate-pulse space-y-5 px-4 py-6">
      <div className="h-48 rounded-3xl bg-vds-elevated" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-96 rounded-3xl bg-vds-elevated lg:col-span-2" />
        <div className="h-96 rounded-3xl bg-vds-elevated" />
      </div>
    </main>
  );
}
