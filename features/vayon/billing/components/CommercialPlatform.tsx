"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/features/platform/design-system";
import { subscriptionEntitlementCatalog } from "../config/entitlements";
import type { PaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";
import { openCheckoutOverlay } from "./checkout-overlay";
import { refreshSubscriptionState } from "../actions/subscription-center.actions";
const card = "min-w-0 rounded-2xl border border-vds-border bg-vds-surface p-5";
export function CommercialPlans({ catalog, workspaceId, clientToken, environment = "live", subscribed = false, onCheckout, onMessage }: {
  catalog: PaddleCatalogPrice[]; organizationId: string; workspaceId: string; clientToken?: string; environment?: "sandbox" | "live"; subscribed?: boolean; onCheckout?: () => void; onMessage?: (message: string) => void;
}) {
  const router = useRouter();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  function notify(message: string) { setMessage(message); onMessage?.(message); }
  async function confirmPayment() {
    setBusy(null); notify("Payment received. Waiting for subscription confirmation…");
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!mounted.current) return;
      try {
        const current = await refreshSubscriptionState(workspaceId);
        if (!mounted.current) return;
        if (current.status === "active") { notify("Your subscription is active. Continue working in VAYON."); router.refresh(); return; }
      } catch { break; }
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
      if (!response.ok || !result.success || !result.transactionId) throw new Error("Checkout is temporarily unavailable. Please try again.");
      onCheckout?.();
      await openCheckoutOverlay(result.transactionId, clientToken, environment, () => { void confirmPayment(); }, () => setBusy(null));
    } catch { notify("Checkout could not open. Your workspace and data are safe. Please try again."); setBusy(null); }
  }
  return <section className="mt-5" aria-label="Compare subscription plans">
    <p className="text-sm text-vds-muted">Choose the plan that fits your team. Manage your subscription here in VAYON.</p>
    <div role="group" aria-label="Billing period" className="my-5 flex flex-wrap gap-3">{(["monthly", "annual"] as const).map(value => <Button key={value} variant={period === value ? "primary" : "control"} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === "monthly" ? "Monthly" : "Annual"}</Button>)}</div>
    <div className="grid gap-4 lg:grid-cols-3">{(["starter", "professional", "enterprise"] as const).map(code => {
      const plan = subscriptionEntitlementCatalog[code];
      const price = catalog.find(item => item.plan === code && item.period === period);
      const formatted = price ? new Intl.NumberFormat("en-US", { style: "currency", currency: price.currencyCode }).format(Number(price.amount) / 10 ** (new Intl.NumberFormat("en-US", { style: "currency", currency: price.currencyCode }).resolvedOptions().maximumFractionDigits ?? 2)) : null;
      return <article key={code} className={card}><h3 className="text-lg font-semibold">{plan.name}</h3><p className="mt-2 text-sm text-vds-muted">{plan.audience}</p><p className="mt-4 text-2xl font-semibold">{formatted ?? (code === "enterprise" ? "Custom agreement" : "Pricing is being updated")}</p>{price && <p className="text-sm text-vds-muted">per {period === "monthly" ? "month" : "year"}</p>}
        <dl className="my-5 grid gap-3 text-sm">{[["Seats", plan.quotas.users ?? "Unlimited"], ["Storage", plan.quotas.storage_gb === null ? "Unlimited" : plan.quotas.storage_gb + " GB"], ["AI requests", plan.quotas.ai_requests ?? "Unlimited"], ["Reports", plan.quotas.reports ?? "Unlimited"], ["Support", plan.features.includes("priority_support" as never) ? "Priority support" : "Standard support"]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-vds-muted">{label}</dt><dd>{value}</dd></div>)}</dl>
        <details className="mb-5 text-sm"><summary className="cursor-pointer">Included capabilities</summary><ul className="mt-3 space-y-2">{plan.features.filter(feature => feature !== "founder_tools").map(feature => <li key={feature}>{feature.replaceAll("_", " ")}</li>)}</ul></details>
        {price && clientToken && !subscribed ? <Button variant="primary" disabled={busy !== null} onClick={() => checkout(code)}>{busy === code ? "Opening checkout…" : "Upgrade to " + plan.name}</Button> : <p className="text-sm text-vds-muted">{subscribed ? "Manage your current subscription below." : code === "enterprise" ? "Enterprise upgrades require an agreed contract." : "Online checkout is temporarily unavailable."}</p>}
      </article>;
    })}</div><p className="mt-4 text-sm" role="status">{message}</p>
  </section>;
}
export function ProviderHealthGrid({
  items,
}: {
  items: readonly {
    provider: string;
    state: "healthy" | "warning" | "offline";
    latencyMs: number | null;
    lastCheckedAt: string | null;
    diagnostic: string;
  }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article className={card} key={item.provider}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold capitalize">
              {item.provider.replaceAll("_", " ")}
            </h2>
            <span
              className={
                item.state === "healthy"
                  ? "text-vds-success"
                  : item.state === "warning"
                    ? "text-vds-warning"
                    : "text-vds-danger"
              }
            >
              {item.state}
            </span>
          </div>
          <p className="mt-3 text-sm text-vds-muted">
            Latency:{" "}
            {item.latencyMs === null ? "Unavailable" : `${item.latencyMs} ms`}
          </p>
          <p className="mt-1 text-xs text-vds-muted">
            Checked:{" "}
            {item.lastCheckedAt
              ? new Date(item.lastCheckedAt).toLocaleString()
              : "Never"}
          </p>
          {item.state !== "healthy" && (
            <p className="mt-3 text-xs text-vds-warning">{item.diagnostic}</p>
          )}
        </article>
      ))}
    </div>
  );
}
