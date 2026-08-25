"use client";
import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { Button, ButtonLink } from "@/features/platform/design-system";
import { CurrencyDisplay } from "../currency/CurrencyDisplay";
const shell = "mx-auto max-w-[96rem] px-5 py-20 sm:px-8",
  card =
    "rounded-3xl border border-vds-border bg-vds-surface/80 shadow-xl shadow-vds-shadow/10";
const plans = [
  {
    name: "Starter",
    price: 79,
    tag: "Launch your business with AI",
    audience: "Founders and startups",
    users: "3",
    workspaces: "1",
    storage: "10 GB",
    popular: false,
  },
  {
    name: "Professional",
    price: 149,
    tag: "Grow with AI employees",
    audience: "Growing teams",
    users: "10",
    workspaces: "3",
    storage: "100 GB",
    popular: true,
  },
  {
    name: "Business",
    price: 399,
    tag: "Run your organization with AI",
    audience: "Established businesses",
    users: "50",
    workspaces: "10",
    storage: "500 GB",
    popular: false,
  },
  {
    name: "Business Plus",
    price: 799,
    tag: "Scale teams and locations",
    audience: "Multi-department operations",
    users: "Custom",
    workspaces: "Custom",
    storage: "Custom",
    popular: false,
  },
  {
    name: "Enterprise",
    price: null,
    tag: "Dedicated enterprise operating system",
    audience: "Large organizations",
    users: "Unlimited",
    workspaces: "Unlimited",
    storage: "Custom",
    popular: false,
  },
] as const;
const softwareCosts = [
  ["CRM", "$50–150+"],
  ["AI Writing Assistant", "$20–30"],
  ["AI Image Generation", "$20–40"],
  ["AI Video Generation", "$20–60"],
  ["Graphic Design Platform", "$15–60"],
  ["Project Management", "$10–40"],
  ["Marketing Automation", "$50–300+"],
  ["Business Intelligence", "$30–100+"],
  ["Customer Success Platform", "$80–300+"],
  ["Brand Management", "$20–100+"],
  ["Document Generation", "$20–50"],
  ["Sales Enablement", "$40–150+"],
] as const;
const valueBenefits = [
  "Lower software costs",
  "Fewer subscriptions",
  "Less context switching",
  "One AI Workspace",
  "Unified customer data",
  "Faster business launch",
  "Enterprise governance",
  "AI employees included",
] as const;
const rows = [
  "AI Business Launch",
  "CRM",
  "Contacts",
  "Companies",
  "Sales Pipeline",
  "Marketing Studio",
  "Campaign Studio",
  "Brand Studio",
  "Document Studio",
  "Image Studio",
  "Video Studio",
  "Creative Studio",
  "AI Workforce",
  "AI Assistants",
  "Business Intelligence",
  "Founder Dashboard",
  "Customer Success",
  "Analytics",
  "Automation",
  "Projects",
  "Asset Library",
  "Team Members",
  "Workspaces",
  "Storage",
  "Approvals",
  "Version History",
  "Role Management",
  "Audit Logs",
  "Priority Support",
  "Dedicated Success Manager",
  "SSO",
  "Private Cloud",
  "White Label",
  "API Access",
  "Custom Integrations",
  "SLA",
] as const;
const faqs = [
  [
    "How does billing work?",
    "Paid editions are billed through the existing Stripe subscription lifecycle. Enterprise agreements follow an approved order form.",
  ],
  [
    "Can I change plans?",
    "Yes. Upgrades and downgrades use the existing billing portal and entitlement engine.",
  ],
  [
    "Is there a free trial?",
    "Eligible self-service plans can begin with the existing trial flow before paid conversion.",
  ],
  [
    "How is data secured?",
    "VAYON preserves tenant isolation, RBAC, audit history, approvals and provider-side secret protection.",
  ],
  [
    "How does AI work?",
    "AI requests use governed runtimes, provider adapters, quotas and human approval where required.",
  ],
  [
    "What is included with Enterprise?",
    "Enterprise packaging can include SSO, private infrastructure, custom integrations, training, support and SLA terms.",
  ],
  [
    "What support is available?",
    "Support level follows the selected commercial package and signed enterprise agreement.",
  ],
  [
    "What happens to data after a downgrade?",
    "Access changes follow entitlements; data lifecycle remains governed by the existing subscription and retention systems.",
  ],
  [
    "Is annual billing available?",
    "Yes. The annual selector presents an estimated 20% annual commitment discount for sales evaluation.",
  ],
] as const;
export const pricingSectionLabel =
  "Compare plans · Pricing FAQ · Professional · Growth-ready";
export function PricingTable() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <section
        className="relative overflow-hidden border-b border-vds-border"
        id="plans"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--vds-color-primary-soft),transparent_52%)]" />
        <div className={`${shell} relative py-24 sm:py-28`}>
          <div className="text-center">
            <p className="eyebrow">Simple pricing</p>
            <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-semibold tracking-[-.055em] sm:text-7xl">
              Choose the plan that fits your business.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-vds-muted">
              Clear plans for teams at every stage, from launch to enterprise
              scale.
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <div
              role="group"
              aria-label="Billing period"
              className="flex rounded-xl border border-vds-border bg-vds-surface p-1"
            >
              <Button
                variant={annual ? "primary" : "control"}
                onClick={() => setAnnual(true)}
              >
                Annual · save 20%
              </Button>
              <Button
                variant={!annual ? "primary" : "control"}
                onClick={() => setAnnual(false)}
              >
                Monthly
              </Button>
            </div>
          </div>
        <div
          aria-label="Commercial packages"
          className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`${card} relative p-6 ${plan.popular ? "border-vds-accent-border shadow-2xl" : ""}`}
            >
              {plan.popular && (
                <span className="absolute right-4 top-4 rounded-full bg-vds-primary px-2 py-1 text-[10px] font-semibold text-vds-on-accent">
                  MOST POPULAR
                </span>
              )}
              <p className="text-sm font-semibold text-vds-primary">
                {plan.name}
              </p>
              <p className="mt-5 text-4xl font-semibold">
                {plan.price === null ? (
                  "Custom"
                ) : (
                  <CurrencyDisplay
                    valueUsd={
                      annual ? Math.round(plan.price * 0.8) : plan.price
                    }
                  />
                )}{" "}
                {plan.price !== null && (
                  <span className="text-xs font-normal text-vds-muted">
                    / month
                  </span>
                )}
              </p>
              <p className="mt-4 min-h-12 text-sm text-vds-muted">{plan.tag}</p>
              <p className="mt-4 text-xs text-vds-subtle">{plan.audience}</p>
              <ul className="mt-5 space-y-2 text-sm">
                <li>✓ {plan.users} team members</li>
                <li>✓ {plan.workspaces} workspaces</li>
                <li>✓ {plan.storage} storage</li>
              </ul>
              <ButtonLink
                fullWidth
                className="mt-7"
                variant={plan.popular ? "primary" : "outline"}
                href={
                  plan.name === "Enterprise" || plan.name === "Business Plus"
                    ? "/contact?intent=sales"
                    : `/signup?plan=${plan.name.toLowerCase()}`
                }
              >
                {plan.name === "Enterprise" || plan.name === "Business Plus"
                  ? "Contact Sales"
                  : "Start Free Trial"}
              </ButtonLink>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs text-vds-subtle">
          Displayed prices are commercial packaging for sales evaluation.
          Checkout, billing state and entitlements remain authoritative in the
          existing Subscription and Stripe systems.
        </p>
          </div>
      </section>
      <section className="border-b border-vds-border bg-vds-surface/40">
        <div className={`${shell} py-24 sm:py-28`}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-6xl">
              Why VAYON Saves You Money
            </h2>
            <p className="mt-6 text-lg leading-8 text-vds-muted">
              Instead of buying and managing many disconnected tools, VAYON
              combines everything into one AI Business Operating System.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-vds-border bg-vds-surface/80 shadow-2xl shadow-vds-shadow/10">
            <table className="w-full text-left">
              <caption className="sr-only">
                Typical monthly costs for separate business software tools
              </caption>
              <thead className="bg-vds-elevated text-sm">
                <tr>
                  <th scope="col" className="px-5 py-4 sm:px-7">
                    Software Category
                  </th>
                  <th scope="col" className="px-5 py-4 text-right sm:px-7">
                    Typical Monthly Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {softwareCosts.map(([category, cost]) => (
                  <tr key={category} className="border-t border-vds-border">
                    <th scope="row" className="px-5 py-4 font-medium sm:px-7">
                      {category}
                    </th>
                    <td className="px-5 py-4 text-right text-vds-muted sm:px-7">
                      {cost}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-vds-accent-border bg-vds-primary-soft">
                  <th
                    scope="row"
                    className="px-5 py-5 text-lg font-semibold sm:px-7"
                  >
                    TOTAL
                  </th>
                  <td className="px-5 py-5 text-right text-lg font-semibold sm:px-7">
                    $355–1,380+/month
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <p className="text-lg leading-8 text-vds-muted">
              Instead of paying for 10–12 separate business tools, VAYON brings
              your CRM, AI Workforce, Creative Studio, Marketing, Sales,
              Customer Success and Business Intelligence together in one
              intelligent platform.
            </p>
            <p className="mt-7 text-2xl font-semibold leading-relaxed">
              One login.<br />One workspace.<br />One AI operating system.
            </p>
          </div>
        </div>
      </section>
      <section className={`${shell} py-24 sm:py-28`}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold tracking-[-.04em] sm:text-6xl">
            Why Businesses Choose VAYON
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueBenefits.map((benefit) => (
            <article
              className={`${card} flex min-h-36 flex-col justify-between p-6`}
              key={benefit}
            >
              <CheckCircle2
                className="size-6 text-vds-primary"
                aria-hidden="true"
              />
              <h3 className="mt-8 text-lg font-semibold">{benefit}</h3>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-vds-border">
        <div className={shell}>
          <Heading
            eyebrow="Enterprise comparison"
            title="Compare capabilities, governance and scale."
          />
          <div className="mt-9 overflow-x-auto rounded-2xl border border-vds-border">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <caption className="sr-only">
                VAYON commercial package comparison
              </caption>
              <thead className="bg-vds-elevated">
                <tr>
                  <th className="p-4" scope="col">
                    Capability
                  </th>
                  {plans.map((p) => (
                    <th className="p-4" scope="col" key={p.name}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr className="border-t border-vds-border" key={row}>
                    <th scope="row" className="p-4 font-medium">
                      {row}
                    </th>
                    {plans.map((plan, p) => (
                      <td className="p-4 text-vds-muted" key={plan.name}>
                        {value(row, index, p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className={shell}>
        <div
          className={`${card} grid gap-8 p-8 lg:grid-cols-2 lg:items-center`}
        >
          <div>
            <p className="eyebrow">Return on investment</p>
            <h2 className="mt-4 text-3xl font-semibold">
              Invest in outcomes, not another disconnected tool.
            </h2>
            <p className="mt-4 leading-7 text-vds-muted">
              Estimate how much you currently spend across multiple software
              subscriptions. Then compare it with VAYON&apos;s unified platform.
              Savings vary depending on your existing software stack.
            </p>
          </div>
          <div className="grid gap-3">
            <Metric
              label="Estimated monthly software spend"
              value="Your current stack"
            />
            <div className="text-center text-vds-primary">↓</div>
            <Metric
              label="VAYON unified platform"
              value="Compare with your selected plan"
            />
          </div>
        </div>
      </section>
      <section className={shell}>
        <Heading eyebrow="FAQ" title="Commercial questions, answered." />
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {faqs.map(([q, a]) => (
            <details className={`${card} p-5`} key={q}>
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-3 text-sm leading-6 text-vds-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="border-y border-vds-border">
        <div className={shell}>
          <div
            className={`${card} overflow-hidden border-vds-accent-border bg-vds-primary-soft p-8 sm:p-12`}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="eyebrow">Enterprise</p>
                <h2 className="mt-4 text-4xl font-semibold">
                  Designed around your security, scale and operating model.
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    "Custom AI",
                    "Dedicated Infrastructure",
                    "SSO",
                    "Private Cloud",
                    "Custom Integrations",
                    "Dedicated Success Manager",
                    "Training",
                    "Priority Support",
                    "Enterprise SLA",
                  ].map((x) => (
                    <span
                      className="rounded-full border border-vds-border px-3 py-1.5 text-sm"
                      key={x}
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </div>
              <ButtonLink href="/contact?intent=sales" size="lg">
                Contact Sales
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <section className={`${shell} text-center`}>
        <h2 className="text-4xl font-semibold">
          Ready to run your business with AI?
        </h2>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            Start Free Trial
          </ButtonLink>
          <ButtonLink href="/contact?intent=demo" variant="outline" size="lg">
            Book Demo
          </ButtonLink>
          <ButtonLink href="/contact?intent=sales" variant="ghost" size="lg">
            Talk to Sales
          </ButtonLink>
        </div>
        <div
          className="sr-only"
          data-commercial-analytics="plan-popularity upgrade-funnel conversion-funnel trial-conversion mrr-projection arr-projection"
        >
          Founder analytics foundation uses existing conversion and subscription
          evidence; no metrics are fabricated.
        </div>
      </section>
    </>
  );
}
function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-vds-border bg-vds-elevated p-5">
      <p className="text-sm text-vds-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
function value(row: string, index: number, plan: number) {
  if (row === "Team Members") return plans[plan].users;
  if (row === "Workspaces") return plans[plan].workspaces;
  if (row === "Storage") return plans[plan].storage;
  const threshold =
    index < 5 ? 0 : index < 15 ? 1 : index < 25 ? 2 : index < 30 ? 3 : 4;
  return plan >= threshold ? (
    <span className="inline-flex items-center gap-1 text-vds-primary">
      <Check className="size-4" />
      Included
    </span>
  ) : (
    "—"
  );
}
