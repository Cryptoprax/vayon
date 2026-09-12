import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { BillingHeader } from "@/features/vayon/billing/components/BillingUI";
import { PaymentMethodList } from "@/features/vayon/billing/components/CommercialBilling";
import { BillingService } from "@/features/vayon/billing/services/billing.service";
export default async function Page(){const data=await new BillingService().dashboard();return <WorkspaceContent ><BillingHeader title="Payment Methods" description="View the payment methods used for your workspace subscription."/><PaymentMethodList items={data.paymentMethods}/></WorkspaceContent>}
