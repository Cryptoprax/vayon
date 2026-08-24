"use client";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { CurrencyDisplay } from "../currency/CurrencyDisplay";

const plans = [
  {
    name: "Starter",
    priceUsd: 59,
    employees: "3 AI Employees",
    users: "3 Users",
    storage: "10 GB",
    integrations: "Core",
    support: "Standard",
    features: ["CRM", "Leads", "Deals", "Gmail", "Calendar"],
  },
  {
    name: "Professional",
    priceUsd: 179,
    employees: "8 AI Employees",
    users: "Unlimited Users",
    storage: "100 GB",
    integrations: "Business",
    support: "Priority",
    features: [
      "CRM",
      "WhatsApp",
      "Calendar",
      "Gmail",
      "Analytics",
      "Automations",
    ],
  },
  {
    name: "Business",
    priceUsd: 399,
    employees: "Unlimited AI Employees",
    users: "Unlimited Users",
    storage: "500 GB",
    integrations: "Advanced",
    support: "Premier",
    features: ["CRM", "Leads", "Deals", "Gmail", "Calendar", "WhatsApp", "Analytics", "Automations"],
  },
  {
    name: "Enterprise",
    priceUsd: null,
    employees: "Unlimited AI Employees",
    users: "Unlimited Users",
    storage: "Custom",
    integrations: "Enterprise",
    support: "Dedicated success",
    features: [
      "Everything enabled",
      "Enterprise governance",
      "Dedicated commercial review",
    ],
  },
] as const;
const matrix = [
  "CRM",
  "Leads",
  "Deals",
  "Gmail",
  "Calendar",
  "WhatsApp",
  "Analytics",
  "Automations",
] as const;
export const pricingSectionLabel =
  "Compare plans · Pricing FAQ · Professional · Growth-ready";

export function PricingTable() {
  const [annual, setAnnual] = useState(true);
  return (
    <section
      aria-labelledby="pricing-heading"
      className="mx-auto max-w-[90rem] px-5 py-24 sm:px-8"
    >
      <p className="eyebrow">Pricing</p>
      <h2
        id="pricing-heading"
        className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl"
      >
        Choose the operating model that fits.
      </h2>
      <p className="mt-5 max-w-2xl text-lg text-vds-muted">
        Start focused, equip every department, or design an enterprise
        deployment.
      </p>
      <div className="mt-7 inline-flex rounded-xl border border-vds-border bg-vds-surface p-1" aria-label="Billing period">
        <Button variant="control" type="button" onClick={() => setAnnual(false)} className={`rounded-lg px-4 py-2 text-sm ${!annual ? "bg-vds-primary text-vds-on-accent" : "text-vds-muted"}`}>Monthly</Button>
        <Button variant="control" type="button" onClick={() => setAnnual(true)} className={`rounded-lg px-4 py-2 text-sm ${annual ? "bg-vds-primary text-vds-on-accent" : "text-vds-muted"}`}>Annual · save 20%</Button>
      </div>
      <div className="mt-12 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const enterprise = plan.name === "Enterprise";
          return (
            <article
              className={`relative rounded-3xl border p-7 ${enterprise ? "border-vds-accent-border bg-vds-primary-soft shadow-2xl" : "border-vds-border bg-vds-surface"}`}
              key={plan.name}
            >
              {enterprise && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-vds-primary px-2.5 py-1 text-[10px] font-semibold text-vds-on-accent">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Recommended
                </span>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-7 text-4xl font-semibold">
                {plan.priceUsd === null ? "Custom" : <CurrencyDisplay valueUsd={annual ? Math.round(plan.priceUsd * 0.8) : plan.priceUsd} />}
                <span className="text-sm font-normal text-vds-muted">
                  {plan.priceUsd !== null ? " / month" : ""}
                </span>
              </p>
              <p className="mt-3 text-sm text-vds-muted">
                {plan.employees} · {plan.users}
              </p>
              <p className="mt-2 text-xs text-vds-subtle">{plan.storage} storage · {plan.integrations} integrations · {plan.support} support</p>
              <ul className="mt-7 space-y-3">
                {plan.features.map((item) => (
                  <li className="flex gap-2 text-sm" key={item}>
                    <Check
                      className="size-4 text-vds-primary"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink
                className="mt-8"
                fullWidth
                variant={enterprise ? "primary" : "outline"}
                href={
                  enterprise
                    ? "/contact?intent=sales"
                    : `/signup?plan=${plan.name.toLowerCase()}`
                }
              >
                {enterprise ? "Contact sales" : "Start free trial"}
              </ButtonLink>
            </article>
          );
        })}
      </div>
      <div className="mt-12 overflow-x-auto rounded-2xl border border-vds-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Vayon feature matrix</caption>
          <thead>
            <tr>
              <th scope="col" className="p-4">
                Feature
              </th>
              {plans.map((plan) => (
                <th scope="col" className="p-4" key={plan.name}>
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((feature) => (
              <tr className="border-t border-vds-border" key={feature}>
                <th scope="row" className="p-4">
                  {feature}
                </th>
                {plans.map((plan) => (
                  <td className="p-4" key={plan.name}>
                    {plan.name === "Enterprise" ||
                    plan.features.includes(feature as never)
                      ? "Included"
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
