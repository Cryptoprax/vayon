"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/features/platform/design-system";
import type { SubscriptionRecord } from "../types";
import type { PublicPaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";
import { isSubscriptionPlanCode } from "../config/entitlements";
import { resolvePlanAction } from "../services/plan-action";
import { manageSubscription } from "../actions/subscription-center.actions";
import { containDialogFocus } from "./dialog-keyboard";
import { openCheckoutOverlay } from "./checkout-overlay";
export function SubscriptionManagement({ subscription, catalog, clientToken, environment = "live" }: { subscription: SubscriptionRecord; catalog: PublicPaddleCatalogPrice[]; clientToken?: string; environment?: "sandbox" | "live" }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const confirm = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const currentPlanCode = subscription.planCode && isSubscriptionPlanCode(subscription.planCode) ? subscription.planCode : null;
  const catalogPlans = Array.from(new Set(catalog.map(price => price.plan)));
  const planAction = (plan: (typeof catalogPlans)[number]) => resolvePlanAction({ planCode: plan, currentPlanCode, hasActiveSubscription: true, checkoutEnabled: true, hasClientToken: true });
  // Only ever list plans the canonical ladder resolves as an upgrade; a stale/unknown
  // current plan fails closed to no upgrade options rather than guessing a direction.
  const upgradeablePlans = catalogPlans.filter(plan => planAction(plan) === "upgrade");
  const canOfferLowerPlan = catalogPlans.some(plan => planAction(plan) === "manage");
  async function submit(form: FormData) {
    if (form.get("intent") === "change") {
      const plan = String(form.get("plan"));
      // Defense in depth: even a tampered/stale form value cannot reach manageSubscription
      // unless the canonical ladder itself resolves it as an upgrade.
      if (!(upgradeablePlans as readonly string[]).includes(plan)) { setMessage("That plan change is not available here. Contact support to downgrade."); return; }
    }
    setBusy(true); setMessage(""); form.set("version", String(subscription.version));
    try {
      const result = await manageSubscription(form);
      setMessage(result.message);
      if (result.ok && result.transactionId && clientToken) await openCheckoutOverlay(result.transactionId, clientToken, environment, () => { setMessage("Payment details received. Confirmation may take a moment."); router.refresh(); }, () => setBusy(false));
      else if (result.ok) router.refresh();
    } catch { setMessage("Your request could not be completed. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="mt-6 space-y-4" aria-label="Manage subscription">
    <h2 className="font-semibold">Manage subscription</h2>
    {upgradeablePlans.length > 0 && <form action={submit} className="flex flex-wrap items-end gap-3"><input type="hidden" name="intent" value="change"/><label className="grid gap-2 text-sm">Plan<select name="plan" defaultValue={upgradeablePlans[0]} className="rounded-xl border border-vds-border bg-vds-input p-3">{upgradeablePlans.map(plan => <option key={plan} value={plan}>{plan.replaceAll("_", " ")}</option>)}</select></label><label className="grid gap-2 text-sm">Billing period<select name="period" className="rounded-xl border border-vds-border bg-vds-input p-3"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label><Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" disabled={busy}>Upgrade plan</Button><p className="w-full text-sm text-vds-muted">Plan changes are prorated. Your current seat quantity is preserved.</p></form>}
    {canOfferLowerPlan && <p className="text-sm text-vds-muted">Downgrades are managed separately. Contact support to change to a lower plan.</p>}
    <div className="flex flex-wrap gap-3">{clientToken && <form action={submit}><input type="hidden" name="intent" value="payment"/><Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" disabled={busy}>Update payment method</Button></form>}
      {subscription.cancelAtPeriodEnd ? <form action={submit}><input type="hidden" name="intent" value="resume"/><Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" disabled={busy}>Keep subscription</Button></form> : <Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" disabled={busy} onClick={() => confirm.current?.showModal()}>Cancel subscription</Button>}
    </div><p role="status" className="text-sm">{message}</p>
    <dialog ref={confirm} onKeyDown={containDialogFocus} aria-labelledby="cancel-subscription-title" className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-vds-border bg-vds-surface p-6 text-vds-foreground backdrop:bg-vds-overlay"><h2 id="cancel-subscription-title" className="text-lg font-semibold">Cancel at the end of this billing period?</h2><p className="my-4 text-sm text-vds-muted">Your subscription remains available until the current period ends.</p><div className="flex flex-wrap gap-3"><Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" onClick={() => confirm.current?.close()}>Keep subscription</Button><form action={async form => { confirm.current?.close(); await submit(form); }}><input type="hidden" name="intent" value="cancel"/><Button className="min-h-11 rounded-xl border border-vds-border px-4 py-2" variant="control" disabled={busy}>Confirm cancellation</Button></form></div></dialog>
  </section>;
}
