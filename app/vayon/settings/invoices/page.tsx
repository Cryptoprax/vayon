import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { BillingHeader, InvoiceTable } from "@/features/vayon/billing/components/BillingUI";
import { InvoiceService } from "@/features/vayon/billing/services/invoice.service";
export default async function Page(){const items=await new InvoiceService().list();return <WorkspaceContent ><BillingHeader title="Invoices" description="Review Stripe invoices, tax, payment state, and hosted invoice downloads."/><InvoiceTable items={items}/></WorkspaceContent>}
