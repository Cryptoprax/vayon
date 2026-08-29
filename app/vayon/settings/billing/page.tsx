import dynamic from "next/dynamic";
import Link from "next/link";
import { BillingHeader, SubscriptionStatus } from "@/features/vayon/billing/components/BillingUI";
import { BillingContactForm } from "@/features/vayon/billing/components/BillingForms";
import { PaddlePortalButton } from "@/features/vayon/billing/components/PaddleBilling";
import { CommercialPlans } from "@/features/vayon/billing/components/CommercialPlatform";
import { BillingRecoveryState } from "@/features/vayon/billing/components/BillingRecoveryState";
import { BillingStabilityService } from "@/features/vayon/billing/services/billing-stability.service";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
const Details = dynamic(() => import("@/features/vayon/billing/components/BillingRecoveryDetails"));
// PaddleCatalogService.list() is isolated inside BillingStabilityService so provider failure cannot reject this page.
export default async function Page() {
  await enforcePagePermission("billing");
  const snapshot = await new BillingStabilityService().safeSnapshot(), data = snapshot.dashboard;
  const hasBillingAccount = Boolean(data.subscription?.providerSubscriptionId);
  return <main className="mx-auto max-w-[96rem] px-5 py-8"><BillingHeader title="Billing" description="Choose and manage your VAYON plan. Billing remains available even while provider setup is incomplete."/><BillingRecoveryState snapshot={snapshot}/><SubscriptionStatus subscription={data.subscription}/>{snapshot.catalog.length ? <CommercialPlans catalog={snapshot.catalog} organizationId={snapshot.organizationId} workspaceId={snapshot.workspaceId}/> : <section className="mt-7 rounded-3xl border border-vds-border bg-vds-surface p-6"><h2 className="text-xl font-semibold">Choose Your First Plan</h2><p className="mt-2 text-sm text-vds-muted">Monthly and annual checkout will become available when Paddle configuration is complete.</p><div className="mt-5 flex flex-wrap gap-3"><Link className="vds-focus rounded-xl bg-vds-primary px-4 py-3 text-sm font-semibold text-vds-on-accent" href="/pricing">Compare Plans</Link><Link className="vds-focus rounded-xl border border-vds-border px-4 py-3 text-sm" href="/contact">Enterprise</Link></div></section>}{hasBillingAccount && <details className="mt-8 rounded-3xl border border-vds-border bg-vds-surface p-5"><summary className="cursor-pointer font-medium">Manage billing</summary><div className="mt-5 flex flex-wrap gap-3"><PaddlePortalButton/><Link className="rounded-xl border border-vds-border px-4 py-3 text-sm" href="/vayon/settings/payment-methods">Payment methods</Link><Link className="rounded-xl border border-vds-border px-4 py-3 text-sm" href="/vayon/settings/invoices">Invoices</Link><Link className="rounded-xl border border-vds-border px-4 py-3 text-sm" href="/vayon/settings/billing/provider-health">Billing status</Link></div><section className="mt-6 grid gap-5 lg:grid-cols-2"><BillingContactForm contact={data.contact}/></section></details>}<Details contact={data.contact} events={data.events} invoices={data.invoices} paymentMethods={data.paymentMethods} subscription={data.subscription} usage={data.usage}/></main>;
}
