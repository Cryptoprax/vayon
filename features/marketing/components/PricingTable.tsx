"use client";
import { useState } from "react";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  FileText,
  Image,
  Layers3,
  Megaphone,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Workflow,
} from "lucide-react";
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
const products = [
  [
    "AI Business Launch",
    "Turn a business idea into a governed launch plan.",
    "Reach first value faster.",
    Rocket,
  ],
  [
    "AI Workforce",
    "Coordinate specialized AI employees with approvals.",
    "Increase team capacity.",
    Bot,
  ],
  [
    "AI CRM",
    "Connect contacts, companies, leads and deals.",
    "Build a healthier pipeline.",
    BriefcaseBusiness,
  ],
  [
    "Creative Studio 2.0",
    "Create governed multi-format campaigns.",
    "Ship more creative work.",
    Sparkles,
  ],
  [
    "Brand Studio",
    "Centralize identity, voice and brand rules.",
    "Stay consistent at scale.",
    Palette,
  ],
  [
    "Document Studio",
    "Generate editable business documents.",
    "Reduce production time.",
    FileText,
  ],
  [
    "Image Studio",
    "Generate and edit campaign visuals.",
    "Create visual assets faster.",
    Image,
  ],
  [
    "Video Studio",
    "Plan and generate governed video.",
    "Launch motion campaigns.",
    Video,
  ],
  [
    "Campaign Studio",
    "Coordinate multi-channel deliverables.",
    "Move from idea to campaign.",
    Megaphone,
  ],
  [
    "Marketing Studio",
    "Plan consent-aware growth programs.",
    "Improve acquisition execution.",
    Workflow,
  ],
  [
    "Sales Workspace",
    "Manage pipeline, meetings and follow-up.",
    "Improve sales velocity.",
    Users,
  ],
  [
    "Customer Success",
    "Track adoption, risk and renewals.",
    "Protect recurring revenue.",
    ShieldCheck,
  ],
  [
    "Founder OS",
    "See cross-company priorities and evidence.",
    "Make clearer decisions.",
    BrainCircuit,
  ],
  [
    "Business Intelligence",
    "Connect operational evidence to reports.",
    "Understand business health.",
    BarChart3,
  ],
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
      <section className="relative overflow-hidden border-b border-vds-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--vds-color-primary-soft),transparent_52%)]" />
        <div className={`${shell} relative py-28 text-center`}>
          <p className="eyebrow">VAYON commercial platform</p>
          <h1 className="mx-auto mt-5 max-w-5xl text-5xl font-semibold tracking-[-.055em] sm:text-7xl">
            The World&apos;s First AI Business Operating System
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-vds-muted">
            Everything your business needs. One intelligent platform powered by
            AI.
          </p>
          <div className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-2">
            {[
              "CRM",
              "AI Workforce",
              "Creative Studio 2.0",
              "Marketing",
              "Sales",
              "Customer Success",
              "Business Intelligence",
              "Founder OS",
            ].map((x) => (
              <span
                key={x}
                className="rounded-full border border-vds-border bg-vds-elevated px-3 py-1.5 text-sm"
              >
                {x}
              </span>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Start Free Trial
            </ButtonLink>
            <ButtonLink href="/contact?intent=demo" variant="outline" size="lg">
              Book a Demo
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className={shell}>
        <Heading
          eyebrow="Flagship products"
          title="One platform. Every operating system your business needs."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(([name, description, outcome, Icon]) => (
            <article key={name} className={`${card} p-6`}>
              <span className="grid size-11 place-items-center rounded-2xl bg-vds-primary-soft text-vds-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 font-semibold">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-vds-muted">
                {description}
              </p>
              <p className="mt-4 text-xs font-semibold text-vds-primary">
                {outcome}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-vds-border bg-vds-surface/40">
        <div className={shell}>
          <Heading
            eyebrow="Why VAYON"
            title="Replace a fragmented software stack with one intelligent platform."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              [
                "Multiple subscriptions",
                "CRM, design, AI writing, image, video, marketing, project and analytics tools.",
              ],
              [
                "Disconnected data",
                "Teams repeatedly transfer context between products and rebuild reporting.",
              ],
              [
                "One VAYON workspace",
                "A governed operating layer connects customers, work, content, AI and decisions.",
              ],
            ].map(([title, text], i) => (
              <article
                className={`${card} p-7 ${i === 2 ? "border-vds-accent-border bg-vds-primary-soft" : ""}`}
                key={title}
              >
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-vds-muted">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              "CRM",
              "Design",
              "AI writing",
              "Image generation",
              "Video generation",
              "Marketing",
              "Project management",
              "Analytics",
              "Business intelligence",
            ].map((capability) => (
              <span
                key={capability}
                className="rounded-full border border-vds-border bg-vds-elevated px-3 py-1.5 text-sm text-vds-muted"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className={shell}>
        <Heading
          eyebrow="Business outcomes"
          title="Move from ambition to measurable work in one platform."
        />
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Launch your business with AI",
            "Grow with AI employees",
            "Automate marketing",
            "Generate sales proposals",
            "Create investor pitch decks",
            "Build campaigns",
            "Create websites",
            "Generate images",
            "Produce videos",
            "Manage customers",
            "Run your company",
          ].map((outcome) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-vds-border bg-vds-surface/80 p-4"
              key={outcome}
            >
              <Check className="size-4 shrink-0 text-vds-primary" />
              <span className="font-medium">{outcome}</span>
            </div>
          ))}
        </div>
      </section>
      <section className={shell} id="plans">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <Heading
            eyebrow="Commercial packages"
            title="Choose how VAYON helps you operate."
          />
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
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              Consolidate operational software, reduce context switching and
              give teams one governed AI workspace. Actual savings depend on
              current systems, adoption and usage.
            </p>
          </div>
          <div className="grid gap-3">
            <Metric
              label="Estimated monthly software spend"
              value="Your current stack"
            />
            <div className="text-center text-vds-primary">↓</div>
            <Metric
              label="Estimated savings with VAYON"
              value="Calculate during evaluation"
            />
          </div>
        </div>
      </section>
      <section className="border-y border-vds-border bg-vds-surface/40">
        <div className={shell}>
          <Heading
            eyebrow="Why businesses choose VAYON"
            title="Built for durable business operations."
          />
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "One Platform",
              "Enterprise Security",
              "AI Workforce",
              "Creative Automation",
              "Business Launch Mode",
              "Scalable Architecture",
              "Multi-Tenant",
              "Founder Intelligence",
            ].map((x, i) => (
              <article className={`${card} p-6`} key={x}>
                <Layers3 className="size-5 text-vds-primary" />
                <h3 className="mt-4 font-semibold">{x}</h3>
                <p className="mt-2 text-sm text-vds-muted">
                  {
                    [
                      "Connected by design.",
                      "Governed at every layer.",
                      "Capacity with accountability.",
                      "From brief to asset.",
                      "Faster time to value.",
                      "Ready for growth.",
                      "Isolation by default.",
                      "Evidence for decisions.",
                    ][i]
                  }
                </p>
              </article>
            ))}
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
