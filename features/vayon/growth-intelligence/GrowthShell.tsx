import Link from "next/link";
import { AiCmoPanel } from "./AiCmoPanel";
import { growthSections } from "./catalog";

const navigation = [{ label: "Overview", href: "/vayon/growth" }, ...Object.entries(growthSections).map(([slug, section]) => ({ label: section.title, href: `/vayon/growth/${slug}` }))];

export function GrowthShell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 sm:py-8"><header className="rounded-[2rem] border border-vds-accent-border bg-gradient-to-br from-vds-primary-soft via-vds-surface to-vds-accent-soft p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">VAYON Growth Intelligence</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Your AI Chief Marketing Officer workspace.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-vds-muted sm:text-base">Plan campaigns, content, brand, community, launches, and investor visibility—with human approval before every external action.</p></header>
    <nav aria-label="Growth Intelligence sections" className="mt-5 flex gap-2 overflow-x-auto pb-2">{navigation.map((item) => <Link key={item.href} href={item.href} className="vds-focus shrink-0 rounded-xl border border-vds-border bg-vds-surface px-3 py-2 text-xs font-medium text-vds-muted hover:border-vds-accent-border hover:text-vds-primary">{item.label}</Link>)}</nav>
    <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="min-w-0">{children}</div><AiCmoPanel /></div>
  </main>;
}
