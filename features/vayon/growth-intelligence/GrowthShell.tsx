export function GrowthShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8"><header className="rounded-[2rem] border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">VAYON Real Estate</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Real Estate Growth Center</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">Generate enquiries, strengthen listings, understand buyers and sellers, and turn marketing activity into property transactions.</p></header>
    <div className="mt-5 min-w-0">{children}</div>
  </main>;
}
