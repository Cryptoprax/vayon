import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
﻿import Link from "next/link";
import { ButtonLink } from "@/features/platform/design-system";

export function GrowthOverview({ userName, marketingAvailable = false }: { readonly userName: string; readonly marketingAvailable?: boolean }) {
  return <WorkspaceContent >
    <WorkspaceHeader title="Marketing Performance" description={`${userName}, what should your next property campaign achieve? Start with the audience and message, then prepare the campaign.`} actions={<ButtonLink href="/vayon/growth/lead-generation">Plan lead generation</ButtonLink>} />
    <section aria-labelledby="marketing-next"><h2 id="marketing-next" className="text-xl font-semibold">Continue your marketing work</h2>{marketingAvailable ? <div className="mt-4 grid gap-5 md:grid-cols-2"><Link href="/vayon/creative/campaigns" className="focus-ring rounded-2xl border border-vds-border p-5"><h3 className="font-semibold">Prepare a campaign</h3><p className="mt-2 text-sm text-vds-muted">Choose your project, audience and channels in the campaign wizard.</p></Link><Link href="/vayon/creative" className="focus-ring rounded-2xl border border-vds-border p-5"><h3 className="font-semibold">Create marketing materials</h3><p className="mt-2 text-sm text-vds-muted">Continue in your existing Creative workspace.</p></Link></div> : <p className="mt-4 rounded-2xl border border-vds-border p-5">Continue when Campaigns become available</p>}</section>
  </WorkspaceContent>;
}
