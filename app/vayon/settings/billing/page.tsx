import Link from "next/link";
import { BillingHistory } from "@/features/vayon/billing/components/CommercialBilling";
import {
  BillingContact,
  BillingHeader,
  SeatManager,
  SubscriptionStatus,
  UsageCharts,
} from "@/features/vayon/billing/components/BillingUI";
import { BillingContactForm } from "@/features/vayon/billing/components/BillingForms";
import { PaddlePortalButton } from "@/features/vayon/billing/components/PaddleBilling";
import { CommercialPlans } from "@/features/vayon/billing/components/CommercialPlatform";
import { BillingService } from "@/features/vayon/billing/services/billing.service";
import { billingContext } from "@/features/vayon/billing/services/billing-context";
import { PaddleCatalogService } from "@/features/vayon/billing/services/paddle-catalog.service";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";

export default async function Page() {
  await enforcePagePermission("billing");
  const [data, catalog, context] = await Promise.all([
    new BillingService().dashboard(),
    new PaddleCatalogService().list(),
    billingContext(),
  ]);
  const hasBillingAccount = Boolean(data.subscription?.providerSubscriptionId);
  return (
    <main className="mx-auto max-w-[96rem] px-5 py-8">
      <BillingHeader
        title="Billing"
        description="Choose the plan that fits your business. We’ll use your account email for checkout."
      />
      <SubscriptionStatus subscription={data.subscription} />
      <CommercialPlans
        catalog={catalog}
        organizationId={context.organizationId}
        workspaceId={context.workspaceId}
      />
      {hasBillingAccount && (
        <details className="mt-8 rounded-3xl border border-vds-border bg-vds-surface p-5">
          <summary className="cursor-pointer font-medium">Manage billing</summary>
          <div className="mt-5 flex flex-wrap gap-3">
            <PaddlePortalButton />
            <Link className="rounded-xl border border-vds-border px-4 py-3 text-sm" href="/vayon/settings/payment-methods">Payment methods</Link>
            <Link className="rounded-xl border border-vds-border px-4 py-3 text-sm" href="/vayon/settings/invoices">Invoices</Link>
            <Link className="rounded-xl border border-vds-border px-4 py-3 text-sm" href="/vayon/settings/billing/provider-health">Billing status</Link>
          </div>
          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            <BillingContactForm contact={data.contact} />
            <div className="space-y-5"><BillingContact contact={data.contact} /><SeatManager subscription={data.subscription} /></div>
          </section>
          <UsageCharts items={data.usage} />
          <BillingHistory items={data.events} />
        </details>
      )}
    </main>
  );
}
