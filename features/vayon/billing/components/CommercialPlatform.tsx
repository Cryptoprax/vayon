"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { commercialDisplayPrice, commercialPricingPlans } from "@/features/platform/commercial-pricing";
import { subscriptionEntitlementCatalog, isSubscriptionPlanCode } from "../config/entitlements";
import { resolvePlanAction } from "../services/plan-action";
import type { PublicPaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";
import { unavailableFoundingOffer, type FoundingMemberAvailability } from "../services/founding-member.types";
import type { SubscriptionRecord } from "../types";
import { openCheckoutOverlay } from "./checkout-overlay";
import { refreshSubscriptionState, refreshFoundingAvailability, manageSubscription } from "../actions/subscription-center.actions";

const card = "min-w-0 rounded-2xl border border-vds-border bg-vds-surface p-5";
type Period = "monthly" | "annual";

export function CommercialPlans({ workspaceId, clientToken, environment = "live", subscription = null, checkoutEnabled = false, founding = unavailableFoundingOffer, onCheckout, onMessage }: {
  catalog: PublicPaddleCatalogPrice[]; organizationId: string; workspaceId: string; clientToken?: string; environment?: "sandbox" | "live"; subscription?: SubscriptionRecord | null; checkoutEnabled?: boolean; founding?: FoundingMemberAvailability; onCheckout?: () => void; onMessage?: (message: string) => void;
}) {
  const router = useRouter();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [period, setPeriod] = useState<Period>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [offer, setOffer] = useState(founding);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const next = await refreshFoundingAvailability(workspaceId); if (active) setOffer(next); }
      catch { if (active) setOffer(unavailableFoundingOffer); }
    };
    if (workspaceId) void refresh();
    const timer = window.setInterval(() => { if (workspaceId) void refresh(); }, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [workspaceId]);
  function notify(next: string) { setMessage(next); onMessage?.(next); }
  const hasActiveSubscription = Boolean(subscription?.providerSubscriptionId && subscription.status !== "cancelled");
  const currentPlanCode = subscription?.planCode && isSubscriptionPlanCode(subscription.planCode) ? subscription.planCode : null;
  async function confirmPayment() {
    setBusy(null); notify("Payment received. Waiting for subscription confirmation...");
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!mounted.current) return;
      try { const current = await refreshSubscriptionState(workspaceId); if (!mounted.current) return; if (current.status === "active") { notify("Your subscription is active. Continue working in VAYON."); router.refresh(); return; } } catch { break; }
      await new Promise(resolve => window.setTimeout(resolve, 2000));
    }
    notify("Payment received. Confirmation is taking a little longer. Refresh your subscription shortly."); router.refresh();
  }
  async function confirmPlanChange(plan: string) {
    notify("Plan change received. Waiting for confirmation...");
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!mounted.current) return;
      try { const current = await refreshSubscriptionState(workspaceId); if (!mounted.current) return; if (current.plan === plan) { notify("Your plan is now updated. Continue working in VAYON."); router.refresh(); return; } } catch { break; }
      await new Promise(resolve => window.setTimeout(resolve, 2000));
    }
    notify("Your plan change was received. Confirmation is taking a little longer. Refresh shortly."); router.refresh();
  }
  async function checkout(plan: string) {
    if (!clientToken || busy) return;
    setBusy(plan); setMessage("");
    try {
      const response = await fetch("/api/billing/paddle/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planCode: plan, billingPeriod: period, seatQuantity: 1 }) });
      const result = await response.json();
      if (!response.ok || !result.success || !result.transactionId) throw new Error("Checkout is temporarily unavailable.");
      onCheckout?.(); await openCheckoutOverlay(result.transactionId, clientToken, environment, () => { void confirmPayment(); }, () => setBusy(null));
    } catch { notify("Checkout could not open. Your workspace and data are safe. Please try again."); setBusy(null); }
  }
  async function changePlan(plan: string) {
    // Modifies the existing Paddle subscription server-side; never opens a new
    // checkout, so an active subscriber can never end up with a second one.
    if (busy || !subscription) return;
    setBusy(plan); setMessage("");
    try {
      const form = new FormData();
      form.set("intent", "change"); form.set("plan", plan); form.set("period", period); form.set("version", String(subscription.version));
      const result = await manageSubscription(form);
      if (!result.ok) throw new Error(result.message);
      onCheckout?.(); void confirmPlanChange(plan);
    } catch (error) { notify(error instanceof Error ? error.message : "Your plan change could not be completed. Please try again."); setBusy(null); }
  }
  return <section className="mt-5" aria-label="Compare subscription plans">
    <p className="text-sm text-vds-muted">Choose the plan that fits your team. Manage your subscription here in VAYON.</p>
    <div role="group" aria-label="Billing period" className="my-5 flex flex-wrap gap-3">{(["monthly", "annual"] as const).map(value => <Button key={value} variant={period === value ? "primary" : "control"} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === "monthly" ? "Monthly" : <>Annual {"\u00B7"} save 20%</>}</Button>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{commercialPricingPlans.map(displayPlan => {
      const plan = subscriptionEntitlementCatalog[displayPlan.code];
      const action = resolvePlanAction({ planCode: displayPlan.code, currentPlanCode, hasActiveSubscription, checkoutEnabled, hasClientToken: Boolean(clientToken) });
      const displayPrice = commercialDisplayPrice(displayPlan, period, offer.eligible || offer.applicable);
      return <article key={displayPlan.code} className={`${card} flex h-full flex-col`}>
        <div className="flex flex-col gap-3"><div className="min-w-0"><h3 className="text-lg font-semibold">{displayPlan.name}</h3><p className="mt-2 text-sm text-vds-muted">{displayPlan.audience}</p></div>{displayPrice.promotional && <span className="self-start rounded-full bg-vds-primary px-2 py-1 text-[10px] font-semibold text-vds-on-accent">FOUNDING MEMBER PRICING</span>}</div>
        <p className="mt-4 text-2xl font-semibold">{displayPrice.price === null ? "Custom" : <>{displayPrice.promotional && displayPrice.standardPrice !== null && <span className="mr-2 text-base font-medium text-vds-muted line-through">${displayPrice.standardPrice}</span>}${displayPrice.price}<span className="ml-1 text-sm font-normal text-vds-muted">/ month</span></>}</p>
        {displayPrice.promotional && displayPlan.promotion && <p className="mt-3 rounded-xl bg-vds-primary-soft px-3 py-2 text-xs font-medium text-vds-primary">Limited to the first {displayPlan.promotion.limitAgencies} agencies. ${displayPlan.promotion.promotionalMonthlyPrice}/month for {displayPlan.promotion.durationMonths} months instead of the standard ${displayPlan.standardMonthlyPrice}/month.</p>}
        {period === "annual" && displayPlan.standardMonthlyPrice !== null && <p className="mt-3 text-xs text-vds-muted">${(displayPlan.standardMonthlyPrice * 12 * 0.8).toFixed(2)} billed annually. Annual pricing uses the standard plan rate.</p>}
        {displayPlan.code === "professional" && offer.ownsAllocation && <p className="mt-3 text-xs text-vds-muted">Founding membership: {offer.successfulPeriods} of 12 monthly periods paid.{offer.promotionalEnd ? ` Promotional billing ends ${new Date(offer.promotionalEnd).toLocaleDateString()}.` : ""}{offer.status === "ended" ? " This founding subscription has ended." : ""}</p>}
        <dl className="my-5 grid gap-3 text-sm">{[["Seats", plan.quotas.users ?? "Unlimited"], ["Storage", plan.quotas.storage_gb === null ? "Unlimited" : plan.quotas.storage_gb + " GB"], ["AI requests", plan.quotas.ai_requests ?? "Unlimited"], ["Reports", plan.quotas.reports ?? "Unlimited"], ["Support", plan.features.includes("priority_support" as never) ? "Priority support" : "Standard support"]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-vds-muted">{label}</dt><dd>{value}</dd></div>)}</dl>
        <details className="mb-5 text-sm"><summary className="cursor-pointer">Included capabilities</summary><ul className="mt-3 space-y-2">{plan.features.filter(feature => feature !== "founder_tools").map(feature => <li key={feature}>{feature.replaceAll("_", " ")}</li>)}</ul></details>
        <div className="mt-auto pt-2">
          {action === "contact" ? <ButtonLink className="w-full" variant="outline" href="/contact?intent=sales">Contact Sales</ButtonLink>
          : action === "current" ? <p className="text-sm font-medium text-vds-muted" aria-current="true">Current Plan</p>
          : action === "checkout" ? <Button className="w-full" variant="primary" disabled={busy !== null} onClick={() => checkout(displayPlan.code)}>{busy === displayPlan.code ? "Preparing checkout..." : "Choose " + displayPlan.name}</Button>
          : action === "upgrade" ? <Button className="w-full" variant="primary" disabled={busy !== null} onClick={() => changePlan(displayPlan.code)}>{busy === displayPlan.code ? "Updating plan..." : "Upgrade to " + displayPlan.name}</Button>
          : action === "manage" ? <div className="text-sm text-vds-muted"><p>Downgrades are managed separately.</p><p className="mt-1">Contact support to change to a lower plan.</p></div>
          : <p className="text-sm text-vds-muted">Online checkout is temporarily unavailable.</p>}
        </div>
      </article>;
    })}</div><p className="mt-4 text-sm" role="status">{message}</p>
  </section>;
}
