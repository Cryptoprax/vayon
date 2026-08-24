export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[120rem] animate-pulse space-y-5 px-4 py-6">
      <div className="h-52 rounded-3xl bg-vds-elevated" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="h-52 rounded-3xl bg-vds-elevated" />
        <div className="h-52 rounded-3xl bg-vds-elevated" />
        <div className="h-52 rounded-3xl bg-vds-elevated" />
        <div className="h-52 rounded-3xl bg-vds-elevated" />
      </div>
    </main>
  );
}
