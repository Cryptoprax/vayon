import Link from "next/link";
import { customerGrowthSectionSlugs, growthSections } from "./catalog";

const navigation = [{ label: "Overview", href: "/vayon/growth" }, ...customerGrowthSectionSlugs.map((slug) => ({ label: growthSections[slug].title, href: `/vayon/growth/${slug}` }))];

export function GrowthShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8"><header className="rounded-[2rem] border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">VAYON Real Estate</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Real Estate Growth Center</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">Generate enquiries, strengthen listings, understand buyers and sellers, and turn marketing activity into property transactions.</p></header>
    <nav aria-label="Real Estate Growth Center sections" className="mt-5 flex snap-x gap-2 overflow-x-auto pb-2">{navigation.map((item) => <Link key={item.href} href={item.href} className="vds-focus shrink-0 snap-start rounded-xl border border-vds-border bg-vds-surface px-3 py-2 text-xs font-medium text-vds-muted hover:border-vds-accent-border hover:text-vds-primary">{item.label}</Link>)}</nav>
    <div className="mt-5 min-w-0">{children}</div>
  </main>;
}
