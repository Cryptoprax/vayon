export default function Loading() {
  return <main className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8" aria-busy="true" aria-label="Loading Vayon"><span className="sr-only">Loading Vayon</span><div className="h-3 w-32 animate-pulse rounded-full bg-vds-elevated" /><div className="mt-5 h-12 max-w-2xl animate-pulse rounded-2xl bg-vds-elevated" /><div className="mt-8 grid gap-4 md:grid-cols-3">{[1,2,3].map(item=><div className="h-40 animate-pulse rounded-2xl border border-vds-border bg-vds-surface" key={item} />)}</div></main>;
}
