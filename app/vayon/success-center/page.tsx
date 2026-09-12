import { WorkspaceContent, WorkspaceHeader } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import Link from "next/link";
import { productTour, successResources } from "@/features/onboarding/domain/enterprise-onboarding";

export default function Page() {
  return <WorkspaceContent ><WorkspaceHeader><p className="text-xs font-semibold uppercase tracking-[.2em] text-vds-primary">Customer success</p><h1 className="mt-2 text-3xl font-semibold">Success Center</h1><p className="mt-2 text-sm text-vds-muted">Quick starts, learning resources, support, and your interactive product tour.</p></WorkspaceHeader><section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{successResources.map(([name,href])=><Link className="rounded-2xl border border-vds-border bg-vds-surface p-5 font-medium hover:border-vds-accent-border" href={href} key={name}>{name}</Link>)}</section><section className="mt-8 rounded-2xl border border-vds-border bg-vds-surface p-6"><h2 className="font-semibold">Interactive product tour</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{productTour.map(([name,href],index)=><Link className="rounded-xl bg-vds-elevated p-4 text-sm" href={href} key={name}><span className="text-xs text-vds-primary">{index+1}</span><span className="mt-1 block">{name}</span></Link>)}</div></section></WorkspaceContent>;
}
