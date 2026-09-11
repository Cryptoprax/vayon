import Link from "next/link";
import { ButtonLink } from "@/features/platform/design-system";

export function GrowthOverview({ userName, marketingAvailable = false }: { readonly userName: string; readonly marketingAvailable?: boolean }) {
  return <div className="space-y-6 py-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-vds-border pb-5"><div><h1 className="text-3xl font-semibold">Marketing Performance</h1><p className="mt-3 max-w-3xl text-sm text-vds-muted">{userName}, what should your next property campaign achieve? Start with the audience and message, then prepare the campaign.</p></div><ButtonLink href="/vayon/growth/lead-generation">Plan lead generation</ButtonLink></header>
    <section aria-labelledby="marketing-next"><h2 id="marketing-next" className="text-xl font-semibold">Continue your marketing work</h2>{marketingAvailable ? <div className="mt-4 grid gap-4 md:grid-cols-2"><Link href="/vayon/creative/campaigns" className="focus-ring rounded-2xl border border-vds-border p-5"><h3 className="font-semibold">Prepare a campaign</h3><p className="mt-2 text-sm text-vds-muted">Choose your project, audience and channels in the campaign wizard.</p></Link><Link href="/vayon/creative" className="focus-ring rounded-2xl border border-vds-border p-5"><h3 className="font-semibold">Create marketing materials</h3><p className="mt-2 text-sm text-vds-muted">Continue in your existing Creative workspace.</p></Link></div> : <p className="mt-4 rounded-2xl border border-vds-border p-5">Continue when Campaigns become available</p>}</section>
  </div>;
}
