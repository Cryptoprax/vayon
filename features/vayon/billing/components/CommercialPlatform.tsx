"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/features/platform/design-system";
import type { PaddleCatalogPrice } from "../providers/paddle/paddle-catalog.types";

const card = "rounded-3xl border border-vds-border bg-vds-surface p-5";
const planOrder = [
  "starter",
  "professional",
  "business",
  "business_plus",
] as const;
const planLabels = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  business_plus: "Business Plus",
} as const;

function displayPrice(amount: string, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });
  const decimals = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(Number(amount) / 10 ** decimals);
}

export function CommercialPlans({
  catalog,
  organizationId,
  workspaceId,
}: {
  catalog: PaddleCatalogPrice[];
  organizationId: string;
  workspaceId: string;
}) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: (typeof planOrder)[number]) {
    setLoadingPlan(plan);
    setError(null);
    try {
      const response = await fetch("/api/billing/paddle/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          workspaceId,
          plan,
          billingPeriod,
          quantity: 1,
          planCode: plan,
          seatQuantity: 1,
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url)
        throw new Error(result.error ?? "Paddle Checkout is unavailable.");
      window.location.assign(result.url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Paddle Checkout is unavailable.",
      );
      setLoadingPlan(null);
    }
  }

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Commercial plans</h2>
          <p className="mt-1 text-sm text-vds-muted">
            Live product and price information from your Paddle catalog.
          </p>
        </div>
        <div
          aria-label="Billing period"
          className="flex rounded-full border border-vds-border p-1"
          role="group"
        >
          <Button
            className={`rounded-full px-3 py-1.5 text-xs ${billingPeriod === "monthly" ? "bg-vds-elevated" : "text-vds-muted"}`}
            onClick={() => setBillingPeriod("monthly")}
            variant="control"
          >
            Monthly
          </Button>
          <Button
            className={`rounded-full px-3 py-1.5 text-xs ${billingPeriod === "annual" ? "bg-vds-elevated" : "text-vds-muted"}`}
            onClick={() => setBillingPeriod("annual")}
            variant="control"
          >
            Annual
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {planOrder.map((plan) => {
          const price = catalog.find(
            (item) => item.plan === plan && item.period === billingPeriod,
          );
          if (!price) return null;
          const busy = loadingPlan === plan;
          return (
            <Button
              aria-label={`Choose ${planLabels[plan]} ${billingPeriod} plan`}
              className={`${card} text-left transition hover:border-vds-accent-border hover:bg-vds-elevated disabled:cursor-wait disabled:opacity-70`}
              disabled={loadingPlan !== null}
              key={plan}
              onClick={() => checkout(plan)}
              variant="control"
            >
              <h3 className="font-semibold">{planLabels[plan]}</h3>
              <p className="mt-3 text-2xl font-semibold">
                {displayPrice(price.amount, price.currencyCode)}
              </p>
              <p className="mt-1 text-xs text-vds-muted">
                per {billingPeriod === "monthly" ? "month" : "year"}
              </p>
              <p className="mt-4 text-sm text-vds-muted">
                {price.description ?? `${price.name} subscription`}
              </p>
              <p className="mt-6 text-sm font-medium text-vds-primary">
                {busy ? "Opening Paddle Checkout…" : `Choose ${planLabels[plan]}`}
              </p>
            </Button>
          );
        })}
        <Link
          className={`${card} block transition hover:border-vds-accent-border hover:bg-vds-elevated`}
          href="/contact"
        >
          <h3 className="font-semibold">Enterprise</h3>
          <p className="mt-3 text-2xl font-semibold">Custom</p>
          <p className="mt-1 text-xs text-vds-muted">Contract terms</p>
          <p className="mt-4 text-sm text-vds-muted">
            Custom security, governance, compliance, and integrations.
          </p>
          <p className="mt-6 text-sm font-medium text-vds-primary">
            Contact Sales
          </p>
        </Link>
      </div>
      {error && (
        <p className="mt-4 text-sm text-vds-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
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
