import { KpiCardSkeleton } from "@/features/vayon/dashboard/components/KpiCard";

export default function DashboardLoading() {
  return (
    <main
      className="mx-auto max-w-[100rem] space-y-6 px-4 py-7 sm:px-6 sm:py-9"
      aria-label="Loading Executive Command Center"
      aria-busy="true"
    >
      <div className="rounded-[2rem] border border-vds-border bg-vds-surface p-6 sm:p-8">
        <div className="skeleton h-3 w-48 rounded" />
        <div className="skeleton mt-5 h-12 max-w-xl rounded-xl" />
        <div className="skeleton mt-4 h-4 max-w-2xl rounded" />
        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          <div className="skeleton h-52 rounded-3xl" />
          <div className="skeleton h-52 rounded-3xl" />
        </div>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading key performance indicators">
        {Array.from({ length: 4 }, (_, index) => <KpiCardSkeleton key={index} />)}
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-80 rounded-3xl" />
      </div>
    </main>
  );
}
