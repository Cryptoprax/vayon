import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticationService } from "@/features/authentication/services/authentication.service";
import { WorkspacePermissionService } from "@/features/platform/permissions/runtime/permission.service";
import type { SubscriptionWriteDecision, SubscriptionWriteResource } from "@/features/vayon/billing/services/subscription-write-contract";
import { WorkspaceContent } from "@/features/platform/design-system/layout/WorkspaceLayouts";
import { BillingHeader, SubscriptionStatus, InvoiceTable } from "@/features/vayon/billing/components/BillingUI";
import { BillingContactForm } from "@/features/vayon/billing/components/BillingForms";
import { BillingHistory, PaymentMethodList } from "@/features/vayon/billing/components/CommercialBilling";
import { SubscriptionManagement } from "@/features/vayon/billing/components/SubscriptionManagement";
import { SubscriptionCenter } from "@/features/vayon/billing/components/SubscriptionCenter";
import { BillingStabilityService } from "@/features/vayon/billing/services/billing-stability.service";
import { getWorkspaceTrial } from "@/features/vayon/billing/services/workspace-trial";
import { workspaceTrialLimits } from "@/features/vayon/billing/config/trial";
import { enforcePagePermission } from "@/features/platform/permissions/runtime/http";
export default async function Page({searchParams}: {searchParams: Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const code=params.subscription === "limit" ? "TRIAL_LIMIT_REACHED" : params.subscription === "expired" ? "TRIAL_EXPIRED" : params.subscription === "verify" ? "SUBSCRIPTION_UNVERIFIED" : null;
  const resource: SubscriptionWriteResource = typeof params.resource === "string" && ["properties","leads","companies","members"].includes(params.resource) ? params.resource as SubscriptionWriteResource : "write";
  const blocked: SubscriptionWriteDecision | undefined = code ? {allowed:false,code,resource} : undefined;
  if (blocked) {
    const user=await new AuthenticationService().user();
    if(!user) redirect("/login");
    const permission=await new WorkspacePermissionService().check("billing","view").catch(()=>null);
    if(!permission?.decision.allowed) return <WorkspaceContent><BillingHeader title="Subscription Center" description="Ask your workspace owner to upgrade. Your existing access to records is unchanged."/><SubscriptionCenter catalog={[]} organizationId="" workspaceId="" blocked={blocked}/></WorkspaceContent>;
  }
  await enforcePagePermission("billing");
  const [snapshot, trial] = await Promise.all([new BillingStabilityService().safeSnapshot(), getWorkspaceTrial().catch(() => null)]);
  const data = snapshot.dashboard;
  const hasBillingAccount = Boolean(data.subscription?.providerSubscriptionId);
  return <WorkspaceContent><BillingHeader title="Subscription Center" description="Manage your plan, workspace usage and billing in one place."/>
    <SubscriptionStatus subscription={data.subscription}/>
    {!data.subscription && <p role="status" className="mt-4 text-sm text-vds-muted">We could not confirm your subscription. Refresh to try again, or contact your workspace owner.</p>}
    <SubscriptionCenter blocked={blocked} catalog={snapshot.catalog} organizationId={snapshot.organizationId} workspaceId={snapshot.workspaceId} clientToken={snapshot.canManage ? process.env.PADDLE_CLIENT_TOKEN : undefined} environment={process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "live"} subscribed={Boolean(data.subscription?.providerSubscriptionId)}/>
    <section className="mt-7" aria-labelledby="workspace-usage"><h2 id="workspace-usage" className="text-lg font-semibold">Workspace Usage</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(workspaceTrialLimits).map(([key, limit]) => <article key={key} className="rounded-2xl border border-vds-border p-5"><h3 className="capitalize">{key === "members" ? "Additional Team Members" : key}</h3><p className="mt-3 text-2xl font-semibold">{trial?.usage[key as keyof typeof trial.usage] ?? "Not confirmed"}{trial?.status === "trialing" ? " / " + limit : ""}</p></article>)}</div></section>
    <section className="mt-7"><h2 className="text-lg font-semibold">Invoices</h2><InvoiceTable items={data.invoices}/><Link href="/vayon/settings/invoices" className="mt-3 inline-block text-sm underline">View all invoices</Link></section>
    <section className="mt-7"><h2 className="text-lg font-semibold">Payment Method</h2><PaymentMethodList items={data.paymentMethods}/></section><BillingHistory items={data.events}/>
    <details className="mt-7 rounded-2xl border border-vds-border p-5"><summary className="cursor-pointer font-semibold">Billing details and renewal</summary><div className="mt-5 grid gap-5 lg:grid-cols-2">{snapshot.canManage && <BillingContactForm contact={data.contact}/>} {hasBillingAccount && snapshot.canManage && data.subscription && <SubscriptionManagement subscription={data.subscription} catalog={snapshot.catalog} clientToken={process.env.PADDLE_CLIENT_TOKEN} environment={process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "live"}/>}</div></details>
  </WorkspaceContent>;
}
