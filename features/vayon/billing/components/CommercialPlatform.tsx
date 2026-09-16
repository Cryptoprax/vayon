"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/features/platform/design-system";
import { commercialDisplayPrice, selfServiceCommercialPlans } from "@/features/platform/commercial-pricing";
import { subscriptionEntitlementCatalog } from "../config/entitlements";
import type { PaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";
import { openCheckoutOverlay } from "./checkout-overlay";
import { refreshSubscriptionState } from "../actions/subscription-center.actions";

const card = "min-w-0 rounded-2xl border border-vds-border bg-vds-surface p-5";
type Period = "monthly" | "annual";

export function CommercialPlans({ catalog, workspaceId, clientToken, environment = "live", subscribed = false, onCheckout, onMessage }: {
  catalog: PaddleCatalogPrice[]; organizationId: string; workspaceId: string; clientToken?: string; environment?: "sandbox" | "live"; subscribed?: boolean; onCheckout?: () => void; onMessage?: (message: string) => void;
}) {
  const router = useRouter();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [period, setPeriod] = useState<Period>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  function notify(next: string) { setMessage(next); onMessage?.(next); }
  async function confirmPayment() {
    setBusy(null); notify("Payment received. Waiting for subscription confirmation...");
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!mounted.current) return;
      try { const current = await refreshSubscriptionState(workspaceId); if (!mounted.current) return; if (current.status === "active") { notify("Your subscription is active. Continue working in VAYON."); router.refresh(); return; } } catch { break; }
      await new Promise(resolve => window.setTimeout(resolve, 2000));
    }
    notify("Payment received. Confirmation is taking a little longer. Refresh your subscription shortly."); router.refresh();
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
  return <section className="mt-5" aria-label="Compare subscription plans">
    <p className="text-sm text-vds-muted">Choose the plan that fits your team. Manage your subscription here in VAYON.</p>
    <div role="group" aria-label="Billing period" className="my-5 flex flex-wrap gap-3">{(["monthly", "annual"] as const).map(value => <Button key={value} variant={period === value ? "primary" : "control"} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === "monthly" ? "Monthly" : <>Annual {"\u00B7"} save 20%</>}</Button>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{selfServiceCommercialPlans.map(displayPlan => {
      const plan = subscriptionEntitlementCatalog[displayPlan.code];
      const displayPrice = commercialDisplayPrice(displayPlan, period);
      const mappedPrice = catalog.find(item => item.plan === displayPlan.code && item.period === period);
      const checkoutAvailable = Boolean(mappedPrice && clientToken && !subscribed);
      return <article key={displayPlan.code} className={card}>
        <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{displayPlan.name}</h3><p className="mt-2 text-sm text-vds-muted">{displayPlan.audience}</p></div>{displayPrice.promotional && <span className="rounded-full bg-vds-primary px-2 py-1 text-[10px] font-semibold text-vds-on-accent">FOUNDING MEMBER PRICING</span>}</div>
        <p className="mt-4 text-2xl font-semibold">{displayPrice.promotional && displayPrice.standardPrice !== null && <span className="mr-2 text-base font-medium text-vds-muted line-through">${displayPrice.standardPrice}</span>}${displayPrice.price}<span className="ml-1 text-sm font-normal text-vds-muted">/ month</span></p>
        {displayPrice.promotional && displayPlan.promotion && <p className="mt-3 rounded-xl bg-vds-primary-soft px-3 py-2 text-xs font-medium text-vds-primary">Limited to the first {displayPlan.promotion.limitAgencies} agencies. ${displayPlan.promotion.promotionalMonthlyPrice}/month for {displayPlan.promotion.durationMonths} months instead of the standard ${displayPlan.standardMonthlyPrice}/month.</p>}
        {period === "annual" && displayPlan.promotion && <p className="mt-3 text-xs text-vds-muted">Annual pricing uses the standard plan rate. The Founding Member offer applies to monthly billing.</p>}
        <dl className="my-5 grid gap-3 text-sm">{[["Seats", plan.quotas.users ?? "Unlimited"], ["Storage", plan.quotas.storage_gb === null ? "Unlimited" : plan.quotas.storage_gb + " GB"], ["AI requests", plan.quotas.ai_requests ?? "Unlimited"], ["Reports", plan.quotas.reports ?? "Unlimited"], ["Support", plan.features.includes("priority_support" as never) ? "Priority support" : "Standard support"]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-vds-muted">{label}</dt><dd>{value}</dd></div>)}</dl>
        <details className="mb-5 text-sm"><summary className="cursor-pointer">Included capabilities</summary><ul className="mt-3 space-y-2">{plan.features.filter(feature => feature !== "founder_tools").map(feature => <li key={feature}>{feature.replaceAll("_", " ")}</li>)}</ul></details>
        {checkoutAvailable ? <Button variant="primary" disabled={busy !== null} onClick={() => checkout(displayPlan.code)}>{busy === displayPlan.code ? "Opening checkout..." : "Upgrade to " + displayPlan.name}</Button> : <p className="text-sm text-vds-muted">{subscribed ? "Manage your current subscription below." : "Online checkout is temporarily unavailable."}</p>}
      </article>;
    })}</div><p className="mt-4 text-sm" role="status">{message}</p>
  </section>;
}
