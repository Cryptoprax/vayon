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
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";

export default async function Page() {
  await enforcePagePermission("billing");
  const data = await new BillingService().dashboard();
  return (
    <main className="mx-auto max-w-[96rem] px-5 py-8">
      <BillingHeader
        title="Billing"
        description="Paddle subscriptions, usage, seats, tax, payments, and billing history for this workspace."
      />
      <SubscriptionStatus subscription={data.subscription} />
      <div className="mt-5 flex flex-wrap gap-3">
        <PaddlePortalButton />
        <Link
          className="rounded-xl border border-vds-border px-4 py-3 text-sm"
          href="/vayon/settings/payment-methods"
        >
          Payment methods
        </Link>
        <Link
          className="rounded-xl border border-vds-border px-4 py-3 text-sm"
          href="/vayon/settings/invoices"
        >
          Invoices
        </Link>
        <Link
          className="rounded-xl border border-vds-border px-4 py-3 text-sm"
          href="/vayon/settings/billing/provider-health"
        >
          Provider health
        </Link>
      </div>
      <CommercialPlans />
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <BillingContactForm contact={data.contact} />
        <div className="space-y-5">
          <BillingContact contact={data.contact} />
          <SeatManager subscription={data.subscription} />
        </div>
      </section>
      <UsageCharts items={data.usage} />
      <BillingHistory items={data.events} />
    </main>
  );
}
